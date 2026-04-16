"""
Admin-only API views for KisanBazar admin panel.
All endpoints require IsAdmin permission (role == 'ADMIN').
"""
import threading

from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.listings.models import Listing
from apps.listings.serializers import ListingSerializer
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.prices.models import DailyPrice
from apps.prices.serializers import DailyPriceSerializer
from apps.scraper.models import ScraperLog
from apps.users.models import User
from apps.users.serializers import AdminUserSerializer, UserSerializer
from config.pagination import FlexiblePageNumberPagination


# ── Permission ────────────────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


# ── 1. Overview stats ─────────────────────────────────────────────────────────

class AdminStatsView(APIView):
    """GET /api/admin/stats/"""
    permission_classes = (IsAdmin,)

    def get(self, request):
        today = timezone.localdate()
        return Response({
            'total_users':              User.objects.count(),
            'total_farmers':            User.objects.filter(role='FARMER').count(),
            'total_buyers':             User.objects.filter(role='BUYER').count(),
            'total_listings':           Listing.objects.filter(is_active=True).count(),
            'total_orders':             Order.objects.count(),
            'today_prices':             DailyPrice.objects.filter(date=today).count(),
            'pending_orders':           Order.objects.filter(status='PENDING').count(),
            'pending_verifications':    User.objects.filter(role='FARMER', is_id_verified=False).count(),
        })


# ── 2. Users ──────────────────────────────────────────────────────────────────

class AdminUserListView(ListAPIView):
    """GET /api/admin/users/?role=FARMER&search=&pending_verification=true"""
    permission_classes = (IsAdmin,)
    serializer_class   = AdminUserSerializer
    pagination_class   = FlexiblePageNumberPagination

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role.upper())
        pending = self.request.query_params.get('pending_verification')
        if pending and pending.lower() == 'true':
            qs = qs.filter(role='FARMER', is_id_verified=False)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(full_name__icontains=search)
            )
        return qs


class AdminUserVerifyView(APIView):
    """PATCH /api/admin/users/<pk>/verify/ — set is_id_verified; send email on approval"""
    permission_classes = (IsAdmin,)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', 'verify')   # 'verify' or 'reject'
        if action == 'verify':
            user.is_id_verified = True
        else:
            user.is_id_verified = False
        user.save(update_fields=['is_id_verified'])

        if action == 'verify' and user.email:
            try:
                from django.core.mail import send_mail
                send_mail(
                    subject='किसान बजार — परिचयपत्र प्रमाणीकरण भयो',
                    message=(
                        f'नमस्ते {user.full_name or user.username},\n\n'
                        'तपाईंको परिचयपत्र सफलतापूर्वक प्रमाणीकरण भएको छ। '
                        'अब तपाईं किसान बजारमा login गर्न सक्नुहुनेछ।\n\n'
                        'धन्यवाद,\nकिसान बजार टोली'
                    ),
                    from_email=None,   # uses DEFAULT_FROM_EMAIL
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass   # never crash the verify action due to email failure

        return Response({'id': user.pk, 'is_id_verified': user.is_id_verified})


# ── 3. Listings ───────────────────────────────────────────────────────────────

class AdminListingListView(ListAPIView):
    """GET /api/admin/listings/?is_active=true"""
    permission_classes = (IsAdmin,)
    serializer_class   = ListingSerializer
    pagination_class   = FlexiblePageNumberPagination

    def get_queryset(self):
        qs = Listing.objects.all().select_related('crop', 'farmer').order_by('-created_at')
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


class AdminListingDeleteView(APIView):
    """DELETE /api/admin/listings/<pk>/ — hard delete"""
    permission_classes = (IsAdmin,)

    def delete(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)
        listing.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── 4. Orders ─────────────────────────────────────────────────────────────────

class AdminOrderListView(ListAPIView):
    """GET /api/admin/orders/?status=PENDING"""
    permission_classes = (IsAdmin,)
    serializer_class   = OrderSerializer
    pagination_class   = FlexiblePageNumberPagination

    def get_queryset(self):
        qs = (
            Order.objects
            .all()
            .select_related('buyer', 'listing', 'listing__crop', 'listing__farmer')
            .order_by('-created_at')
        )
        order_status = self.request.query_params.get('status')
        if order_status:
            qs = qs.filter(status=order_status.upper())
        return qs


# ── 5. Prices ─────────────────────────────────────────────────────────────────

class AdminPriceListCreateView(APIView):
    """
    GET  /api/admin/prices/?date=YYYY-MM-DD
    POST /api/admin/prices/  — manual price entry
    """
    permission_classes = (IsAdmin,)

    def get(self, request):
        qs = DailyPrice.objects.all().select_related('crop').order_by('-date', 'crop__name_nepali')
        date = request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        paginator = FlexiblePageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = DailyPriceSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = DailyPriceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(source=DailyPrice.Source.MANUAL)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── 6. Scraper ────────────────────────────────────────────────────────────────

def _run_scraper_task(log_id: int) -> None:
    """Background thread: run the scraper pipeline and update ScraperLog."""
    from apps.scraper.scraper import fetch_raw_prices, save_prices
    try:
        log = ScraperLog.objects.get(pk=log_id)
    except ScraperLog.DoesNotExist:
        return
    try:
        raw_rows = fetch_raw_prices()
        saved, unmatched = save_prices(raw_rows)
        log.status = ScraperLog.Status.SUCCESS
        log.fetched_count = len(raw_rows)
        log.saved_count = saved
        log.unmatched_count = len(unmatched)
    except Exception as exc:
        log.status = ScraperLog.Status.ERROR
        log.error_message = str(exc)[:2000]
    finally:
        log.finished_at = timezone.now()
        log.save()


class AdminScraperRunView(APIView):
    """POST /api/admin/scraper/run/ — trigger manual scrape (max 3/day)"""
    permission_classes = (IsAdmin,)

    def post(self, request):
        today = timezone.localdate()
        runs_today = ScraperLog.objects.filter(
            started_at__date=today,
            triggered_by__isnull=False,
        ).count()
        if runs_today >= 3:
            return Response(
                {'detail': 'Daily manual scraper limit reached (3/day).'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        log = ScraperLog.objects.create(triggered_by=request.user)
        thread = threading.Thread(
            target=_run_scraper_task, args=(log.pk,), daemon=True
        )
        thread.start()
        return Response({'log_id': log.pk, 'status': 'started'}, status=status.HTTP_202_ACCEPTED)


class AdminScraperLogView(ListAPIView):
    """GET /api/admin/scraper/logs/"""
    permission_classes = (IsAdmin,)
    pagination_class   = FlexiblePageNumberPagination

    def get_queryset(self):
        return ScraperLog.objects.select_related('triggered_by').order_by('-started_at')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        items = page if page is not None else qs
        data = [
            {
                'id':              log.pk,
                'status':          log.status,
                'triggered_by':    log.triggered_by.username if log.triggered_by else 'scheduler',
                'fetched_count':   log.fetched_count,
                'saved_count':     log.saved_count,
                'unmatched_count': log.unmatched_count,
                'error_message':   log.error_message,
                'started_at':      log.started_at,
                'finished_at':     log.finished_at,
            }
            for log in items
        ]
        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)
