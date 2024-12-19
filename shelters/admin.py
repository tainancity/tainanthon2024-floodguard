from django.contrib import admin
from .models import ProcessedDataShelters, SheltersDisastertype  # 使用更新後的模型名稱

# 註冊模型
admin.site.register(ProcessedDataShelters)
admin.site.register(SheltersDisastertype)
