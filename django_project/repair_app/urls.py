from django.urls import path
from . import views

urlpatterns = [
    # Render unified interactive dashboard
    path('', views.index_view, name='index'),
    
    # API endpoints
    path('api/services/', views.get_services, name='get_services'),
    path('api/orders/create/', views.create_order, name='create_order'),
    path('api/orders/<int:order_id>/', views.get_order_details, name='get_order_details'),
    path('api/orders/<int:order_id>/messages/', views.send_message, name='send_message'),
    path('api/orders/<int:order_id>/action/', views.trigger_action, name='trigger_action'),
]
