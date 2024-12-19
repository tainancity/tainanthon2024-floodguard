from django.shortcuts import render
# Create your views here.
from django.http import JsonResponse
from .models import ProcessedDataShelters
import requests
from django.conf import settings
import json
from django.views.decorators.csrf import csrf_exempt
import os
import csv
import geopandas as gpd
from pyproj import Transformer

def submit_flood_report(request):
    if request.method == "POST":
        # 取得提交的 JSON 資料
        data = json.loads(request.body)
        
        # 取得資料夾路徑（確保存在）
        data_dir = os.path.join("static/data")
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        # 將資料儲存到 JSON 檔案
        file_path = os.path.join(data_dir, "flood_reports.json")
        try:
            if os.path.exists(file_path):
                # 如果檔案存在，讀取原始資料，並加入新的資料
                with open(file_path, "r", encoding="utf-8") as file:
                    flood_reports = json.load(file)
            else:
                flood_reports = []
                
            flood_reports.append(data)  # 新增資料
            
            with open(file_path, "w", encoding="utf-8") as file:
                json.dump(flood_reports, file, ensure_ascii=False, indent=4)
            
            return JsonResponse({"status": "success", "message": "感謝回復"}, status=200)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    else:
        return JsonResponse({"status": "error", "message": "無效的請求方法"}, status=405)

# def shelter_data(request):
#     shelters = ProcessedDataShelters.objects.all().values()  # 使用新的模型名稱
#     return JsonResponse(list(shelters), safe=False)
def shelter_data(request):
    pass
def map_view(request):
    context = {
        'CWB_API_KEY': settings.CWB_API_KEY,  # 將 API 金鑰傳遞給模板
        'ORS_API_KEY': settings.ORS_API_KEY,
    }
    return render(request, 'map.html', context)

@csrf_exempt
# def fetch_weather_data(request):
#     cwb_api_key = settings.CWB_API_KEY
#     url = f"https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization={cwb_api_key}"
#     response = requests.get(url)
#     return JsonResponse(response.json())
@csrf_exempt
def fetch_weather_data(request):
    api_key = settings.CWB_API_KEY  # 請替換為實際 API 金鑰
    station_id = request.GET.get("StationId")
    url = f"https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001"
    params = {
        "Authorization": api_key,
        "format": "JSON",
        "StationId": station_id,
    }
    response = requests.get(url, params=params)
    return JsonResponse(response.json())

# def get_shapefile_polygons(request, shapefile_name):
#     try:
#         # 构建文件路径
#         shapefile_path = f"static/data/area/{shapefile_name}.shp"
        
#         # 读取 shapefile 数据
#         gdf = gpd.read_file(shapefile_path)
#         print("读取的 GeoDataFrame 数据:")
#         print(gdf)
#         transformer = Transformer.from_crs("EPSG:3826", "EPSG:4326", always_xy=True)
#         # 初始化多边形列表
#         polygons = []

#         # 遍历 GeoDataFrame 行数据
#         for _, row in gdf.iterrows():
#             if row.geometry.type in ['Polygon', 'MultiPolygon']:
#                 coordinates = []
                
#                 # 处理 Polygon 类型
#                 if row.geometry.type == 'Polygon':
#                     # 转换 Polygon 的坐标
#                     coordinates.append([list(coord) for coord in row.geometry.exterior.coords])
                
#                 # 处理 MultiPolygon 类型
#                 elif row.geometry.type == 'MultiPolygon':
#                     for poly in row.geometry.geoms:
#                         coordinates.append([list(coord) for coord in poly.exterior.coords])
                
#                 # 构建多边形数据
#                 polygons.append({
#                     "gridCode": row.get("GRIDCODE", "Unknown"),
#                     "coordinates": coordinates  # 确保使用嵌套列表存储
#                 })

#         print("生成的多边形数据:")
#         print(polygons[0])

#         # 返回 JSON 响应
#         return JsonResponse(polygons, safe=False)
    
#     except Exception as e:
#         # 返回错误信息
#         return JsonResponse({"error": str(e)}, status=500)
def get_shapefile_polygons(request, shapefile_name):
    try:
        # 构建文件路径
        shapefile_path = f"static/data/area/{shapefile_name}.shp"
        
        # 读取 shapefile 数据
        gdf = gpd.read_file(shapefile_path)
        #print("读取的 GeoDataFrame 数据:")
        #print(gdf)

        # 初始化坐标转换器
        transformer = Transformer.from_crs("EPSG:3826", "EPSG:4326", always_xy=True)

        # 初始化多边形列表
        polygons = []

        # 遍历 GeoDataFrame 行数据
        for _, row in gdf.iterrows():
            if row.geometry.type in ['Polygon', 'MultiPolygon']:
                coordinates = []
                
                # 处理 Polygon 类型
                if row.geometry.type == 'Polygon':
                    # 转换 Polygon 的坐标
                    converted_coords = [
                        list(transformer.transform(x, y)) for x, y in row.geometry.exterior.coords
                    ]
                    coordinates.append(converted_coords)
                
                # 处理 MultiPolygon 类型
                elif row.geometry.type == 'MultiPolygon':
                    for poly in row.geometry.geoms:
                        converted_coords = [
                            list(transformer.transform(x, y)) for x, y in poly.exterior.coords
                        ]
                        coordinates.append(converted_coords)
                
                # 构建多边形数据
                if row.get("GRIDCODE") != 1:
                    polygons.append({
                        "gridCode": row.get("GRIDCODE", "Unknown"),
                        "coordinates": coordinates  # 确保使用嵌套列表存储
                    })

        #print("生成的多边形数据:")
        #print(polygons[0])

        # 返回 JSON 响应
        return JsonResponse(polygons, safe=False)
    
    except Exception as e:
        # 返回错误信息
        return JsonResponse({"error": str(e)}, status=500)