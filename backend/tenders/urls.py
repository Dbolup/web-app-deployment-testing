from django.urls import path
from . import views

urlpatterns = [
    # Static action paths must come before the str:ref_id catch-all
    path('fetch/', views.fetch_tenders, name='fetch_tenders'),
    path('fetch-logs/', views.FetchLogListView.as_view(), name='fetch_logs'),
    path('', views.TenderListView.as_view(), name='tender_list'),
    path('<str:ref_id>/', views.TenderDetailView.as_view(), name='tender_detail'),
    path('<str:ref_id>/score/', views.TenderScoreView.as_view(), name='tender_score'),
]
