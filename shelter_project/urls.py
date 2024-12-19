"""
URL configuration for shelter_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from shelters import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path('map/', views.map_view, name='map_view'),
    #path('api/shelters/', views.shelter_data, name='shelter_data'),
    path("submit_flood_report/", views.submit_flood_report, name="submit_flood_report"),
    path('fetch_weather_data/', views.fetch_weather_data, name='fetch_weather_data'),
    path('get_shapefile/<str:shapefile_name>/', views.get_shapefile_polygons, name='get_shapefile'),
]
