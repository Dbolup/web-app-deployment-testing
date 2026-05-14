from django.urls import path
from . import views

urlpatterns = [
    path('', views.IntegrationListView.as_view(), name='integration_list'),
    path('status/', views.integration_status, name='integration_status'),
    path('<int:pk>/', views.IntegrationDetailView.as_view(), name='integration_detail'),
    path('<int:pk>/disconnect/', views.DisconnectIntegrationView.as_view(), name='integration_disconnect'),
]
