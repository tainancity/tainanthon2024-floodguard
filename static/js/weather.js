function openFloodReport() {
    layui.use('layer', function () {
        var layer = layui.layer;

        // 提示用戶標記淹水地點
        layer.confirm('請在地圖上點選並標記淹水地點', {
            title: '提示',
            btn: ['標記地點'] // 按鈕文字
        }, function () {
            let floodMarker = null; // 保存地圖標記

            // 啟用地圖點擊監聽
            map.once('click', function (e) {
                const { lat, lng } = e.latlng; // 獲取點擊位置的經緯度

                // 在地圖上添加標記
                floodMarker = L.marker([lat, lng], { title: "淹水地點" }).addTo(map).bindPopup("淹水地點").openPopup();

                // 打開表單彈窗
                const formIndex = layer.open({
                    type: 1, // 基本層類型
                    title: '淹水回報',
                    area: ['600px', '400px'], // 設定視窗大小
                    shade: 0.5, // 背景遮罩透明度
                    content: `
                        <form id="floodReportForm" class="layui-form" style="padding: 10px;" onsubmit="submitFloodReport(event)">
                            <div class="layui-form-item">
                                <label class="layui-form-label">淹水時間</label>
                                <div class="layui-input-block">
                                    <input type="datetime-local" id="flood_time" name="flood_time" required lay-verify="required" placeholder="請選擇時間" class="layui-input">
                                </div>
                            </div>
                            <div class="layui-form-item">
                                <label class="layui-form-label">淹水地點</label>
                                <div class="layui-input-block">
                                    <input type="text" id="location" name="location" required lay-verify="required" placeholder="已自動填入地點" value="${lat}, ${lng}" class="layui-input">
                                </div>
                            </div>
                            <div class="layui-form-item">
                                <label class="layui-form-label">淹水高度 (cm)</label>
                                <div class="layui-input-block">
                                    <input type="number" id="flood_depth" name="flood_depth" required lay-verify="required" placeholder="請輸入高度" class="layui-input">
                                </div>
                            </div>
                            <div class="layui-form-item">
                                <div class="layui-input-block">
                                    <button type="submit" class="layui-btn layui-btn-normal">提交</button>
                                </div>
                            </div>
                        </form>
                    `,
                    cancel: function () {
                        // 當表單關閉時移除地圖標記
                        if (floodMarker) {
                            map.removeLayer(floodMarker);
                        }
                    }
                });
            });

            // 關閉提示
            layer.closeAll();
        });
    });
}


function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith("csrftoken=")) {
            return cookie.substring("csrftoken=".length, cookie.length);
        }
    }
    return "";
}

function submitFloodReport(event) {
    event.preventDefault();  // 防止表單的默認提交動作

    const floodTime = document.getElementById("flood_time").value;
    const location = document.getElementById("location").value;
    const floodDepth = document.getElementById("flood_depth").value;

    const data = {
        flood_time: floodTime,
        location: location,
        flood_depth: floodDepth
    };

    // 發送 POST 請求到後端
    fetch("/submit_flood_report/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken() // 添加 CSRF token
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error("提交失敗");
    })
    .then(result => {
        if (result.status === "success") {
            layui.layer.msg("感謝回復");  // 顯示成功訊息
            
            // 延遲 2 秒後關閉彈窗
            setTimeout(() => {
                layui.layer.closeAll();  // 關閉彈窗
            }, 2000); // 2000 毫秒 = 2 秒
        } else {
            layui.layer.msg("提交失敗：" + result.message);
        }
    })
    .catch(error => {
        console.error("提交錯誤:", error);
        layui.layer.msg("提交發生錯誤，請稍後再試");
    });
}

async function RestrictedAreaByCWA() {
    const url = '/fetch_weather_data/';  // 使用 Django 後端的代理 URL
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error("無法獲取天氣數據");
        }

        const data = await response.json();
        console.log("天氣數據:", data);

        // 篩選出 CountyName 是 "臺南市" 的資料
        const tainanStations = data.records.Station.filter(station => station.GeoInfo.CountyName === "臺南市");
        console.log("臺南市天氣數據:", tainanStations);

        // 使用篩選後的臺南市數據顯示測站圖標
        const stationIcon = L.icon({
            iconUrl: rainiconUrl,  // 使用 drop.png 圖標
            iconSize: [25, 41],  // 設置圖標大小
            iconAnchor: [12, 41]  // 圖標錨點
        });

        tainanStations.forEach(station => {
            // 使用 WGS84 座標
            const lat = parseFloat(station.GeoInfo.Coordinates.find(coord => coord.CoordinateName === "WGS84").StationLatitude);
            const lon = parseFloat(station.GeoInfo.Coordinates.find(coord => coord.CoordinateName === "WGS84").StationLongitude);
            const rainfall6 = parseFloat(station.RainfallElement.Past6Hr.Precipitation) || 0;
            const rainfall12 = parseFloat(station.RainfallElement.Past12hr.Precipitation) || 0;
            const rainfall24 = parseFloat(station.RainfallElement.Past24hr.Precipitation) || 0;

            // 在地圖上顯示測站圖標
            L.marker([lat, lon], { icon: stationIcon })
                .addTo(map)
                .bindPopup(`
                    <strong>測站名稱:</strong> ${station.StationName} <br>
                    <strong>測站id:</strong> ${station.StationId} <br>
                    <strong>6小時降雨量:</strong> ${rainfall6} mm <br>
                    <strong>12小時降雨量:</strong> ${rainfall12} mm <br>
                    <strong>24小時降雨量:</strong> ${rainfall24} mm 
                `);
        });

    } catch (error) {
        console.error("無法生成測站圖標:", error);
    }
}


async function navigateToNearestShelter() {
    // 確保瀏覽器支援地理定位
    if (!navigator.geolocation) {
        alert("您的瀏覽器不支援定位功能");
        return;
    }

    navigator.geolocation.getCurrentPosition(async position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const userLocation = [userLat, userLng];

        // 添加目前位置標記
        const redPinIcon = L.icon({
            iconUrl: '/static/images/red_pin.png', // 使用靜態文件中的紅色圖標
            iconSize: [25, 41],                   // 圖標大小
            iconAnchor: [12, 41],                 // 圖標錨點
        });

        // 移除舊的目前位置標記（如存在）
        if (window.currentLocationMarker) {
            map.removeLayer(window.currentLocationMarker);
        }

        // 在地圖上標記目前位置
        window.currentLocationMarker = L.marker(userLocation, {
            icon: redPinIcon,
            title: "您的目前位置"
        }).addTo(map).bindPopup("您的目前位置").openPopup();

        // 呼叫 predictFloodArea 劃出禁止通行範圍
        predictFloodArea();

        // 確保已加載避難所數據
        if (!window.shelterData || shelterData.length === 0) {
            alert("避難所資料尚未加載");
            return;
        }

        // 計算最近的避難所
        let nearestShelter = null;
        let shortestDistance = Infinity;

        shelterData.forEach(shelter => {
            const shelterLat = parseFloat(shelter['緯度']);
            const shelterLng = parseFloat(shelter['經度']);
            const distance = calculateDistance(userLat, userLng, shelterLat, shelterLng);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestShelter = shelter;
            }
        });

        if (!nearestShelter) {
            alert("找不到最近的避難所");
            return;
        }

        // 規劃路線
        const shelterLat = parseFloat(nearestShelter['緯度']);
        const shelterLng = parseFloat(nearestShelter['經度']);
        const shelterLocation = [shelterLat, shelterLng];

        planRouteWithRestrictions(userLocation, shelterLocation);
    });
}

// 清除目前位置標記的功能（如需要）
function clearCurrentLocationMarker() {
    if (window.currentLocationMarker) {
        map.removeLayer(window.currentLocationMarker);
        window.currentLocationMarker = null;
    }
}


function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半徑 (公里)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 距離 (公里)
}

function planRouteWithRestrictions(startPoint, endPoint) {
    const avoidPolygons = restrictedAreas.length > 0 ? {
        type: "MultiPolygon",
        coordinates: restrictedAreas.map(polygon => {
            const points = polygon.getLatLngs()[0].map(point => [point.lng, point.lat]);
            const firstPoint = points[0];
            if (points[points.length - 1] !== firstPoint) {
                points.push(firstPoint); // 確保多邊形閉合
            }
            return [points];
        })
    } : null;

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}`;
    const body = {
        coordinates: [[startPoint[1], startPoint[0]], [endPoint[1], endPoint[0]]],
        ...(avoidPolygons ? { options: { avoid_polygons: avoidPolygons } } : {})
    };

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
        .then(response => response.json())
        .then(data => {
            if (!data.routes || !data.routes[0]) {
                alert("無法取得路徑資料");
                return;
            }

            if (routeLayer) map.removeLayer(routeLayer);

            const routeCoordinates = polyline.decode(data.routes[0].geometry);
            const latLngCoordinates = routeCoordinates.map(coord => [coord[0], coord[1]]);

            routeLayer = L.polyline(latLngCoordinates, { color: 'blue', weight: 5 }).addTo(map);
            map.fitBounds(routeLayer.getBounds());
        })
        .catch(error => console.error("Error fetching route:", error));
}

function exportRestrictedAreas() {
    if (restrictedAreas.length === 0) {
        alert("目前沒有設定任何禁止通行區域，無法導出！");
        return;
    }

    // 構建 GeoJSON 格式
    const geoJson = {
        type: "FeatureCollection",
        features: restrictedAreas.map(area => {
            const coordinates = area.getLatLngs()[0].map(latlng => [latlng.lng, latlng.lat]); // 轉換為 [lng, lat] 格式
            return {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates] // GeoJSON 格式需要外層包裹一層
                }
            };
        })
    };

    // 將 GeoJSON 轉換為字符串
    const geoJsonString = JSON.stringify(geoJson, null, 2);

    // 創建下載的 Blob
    const blob = new Blob([geoJsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 創建下載鏈接
    const link = document.createElement("a");
    link.href = url;
    link.download = "restricted_areas.json";
    link.click();

    // 釋放 URL 物件
    URL.revokeObjectURL(url);

    alert("已成功導出禁止通行區域！");
}



let shelterData = []; // 全域變數存放避難所資料

// 載入 shelterdata.json
function loadShelterData() {
    const jsonFilePath = '/static/data/shelterdata.json';
    //console.log('Loading shelter data from:', jsonFilePath);
    return fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            shelterData = data; // 將資料存入全域變數
            window.shelterData = shelterData; // 綁定到全域物件
            //console.log('Shelter data loaded:', shelterData);
        })
        .catch(error => console.error('Error loading shelter data:', error));
}

loadShelterData();  // 載入避難所資料
