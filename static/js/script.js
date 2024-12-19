
// 初始視角設置為台南火車站
var initialLat = 22.9971;
var initialLng = 120.2124;
var map = L.map('map').setView([initialLat, initialLng], 14);

// 不同地圖樣式
var positron = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © CartoDB'
}).addTo(map);

let shelterMarkers = [];
let startPoint = null;
let endPoint = null;
let startMarker = null;
let endMarker = null;
let routeLayer = null;
let selectedDisasterType = "";

////////////////////
// 禁止通行區域
let restrictedAreas = [];  // 用於儲存多個多邊形
let currentRestrictedPoints = [];  // 儲存當前繪製的多邊形
let drawingRestrictedArea = false;
let tempPolygons = []; // 用於儲存臨時框線
// 開始繪製新的禁止通行範圍
function startDrawRestrictedArea() {
    currentRestrictedPoints = [];
    drawingRestrictedArea = true;
    alert("請在地圖上依序點選範圍的頂點，按照順時針或逆時針的方向圈選，完成後請點擊「完成範圍設定」");
    map.on('click', addRestrictedPoint);
}

// 添加一個禁止通行區域的頂點
function addRestrictedPoint(e) {
    currentRestrictedPoints.push([e.latlng.lat, e.latlng.lng]);

    if (currentRestrictedPoints.length > 1) {
        // 清除先前的臨時框線
        tempPolygons.forEach(polygon => map.removeLayer(polygon));
        tempPolygons = []; // 清空臨時框線陣列

        // 繪製新的臨時框線並添加到陣列中
        const tempPolygon = L.polygon(currentRestrictedPoints, { color: 'red', dashArray: '5, 10' });
        tempPolygon.addTo(map);
        tempPolygons.push(tempPolygon);
    }
}

// 完成當前禁止通行區域的繪製
function finishRestrictedArea() {
    if (currentRestrictedPoints.length > 2) {
        // 清除所有臨時框線
        tempPolygons.forEach(polygon => map.removeLayer(polygon));
        tempPolygons = []; // 清空臨時框線陣列

        // 繪製最終多邊形並將其添加到 map 上和 restrictedAreas 中
        const polygon = L.polygon(currentRestrictedPoints, { color: 'red', fillOpacity: 0.5 }).addTo(map);
        restrictedAreas.push(polygon);

        currentRestrictedPoints = [];  // 清空當前繪製點
        alert("禁止通行範圍已設定");
    }
    map.off('click', addRestrictedPoint);
    drawingRestrictedArea = false;
}

//選擇起點和終點
function selectStartPoint() {
    map.once('click', function(e) {
        if (startMarker) map.removeLayer(startMarker);
        startPoint = [e.latlng.lat, e.latlng.lng];
        startMarker = L.marker(startPoint, { title: "起點" }).addTo(map).bindPopup("起點").openPopup();
    });
}

function selectEndPoint() {
    map.once('click', function(e) {
        if (endMarker) map.removeLayer(endMarker);
        endPoint = [e.latlng.lat, e.latlng.lng];
        endMarker = L.marker(endPoint, { title: "終點" }).addTo(map).bindPopup("終點").openPopup();
    });
}

function planRoute() {
    if (!startPoint || !endPoint) {
        alert("請先選擇起點和終點");
        return;
    }

    // 處理多個禁止通行區域並確保每個多邊形的格式
    console.log("Restricted areas:", restrictedAreas);
    const avoidPolygons = restrictedAreas.length > 0 ? {
        type: "MultiPolygon",
        coordinates: restrictedAreas.map(polygon => {
            const points = polygon.getLatLngs()[0].map(point => [point.lng, point.lat]);
            const firstPoint = points[0];
            const lastPoint = points[points.length - 1];
            
            // 確保多邊形閉合
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                points.push(firstPoint);
            }
            return [points];
        })
    } : null;

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}`;
    const body = {
        coordinates: [[startPoint[1], startPoint[0]], [endPoint[1], endPoint[0]]],
        ...(avoidPolygons ? { options: { avoid_polygons: avoidPolygons } } : {})
    };

    console.log("Sending avoid_polygons:", JSON.stringify(avoidPolygons));

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        console.log("API response:", data);

        if (!data.routes || !data.routes[0] || !data.routes[0].geometry) {
            console.error("返回的路徑資料有誤", data);
            alert("無法取得路徑資料");
            return;
        }

        if (routeLayer) map.removeLayer(routeLayer);

        const routeCoordinates = polyline.decode(data.routes[0].geometry);
        const latLngCoordinates = routeCoordinates.map(coord => [coord[0], coord[1]]);

        routeLayer = L.polyline(latLngCoordinates, { color: 'blue', weight: 5 }).addTo(map);
        map.fitBounds(routeLayer.getBounds());
    })
    .catch(error => console.error('Error fetching route:', error.message || error));
}



// 設定使用者位置
function setToCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            map.setView([userLat, userLng], 16);

            L.marker([userLat, userLng], {
                title: "目前位置",
                icon: L.icon({
                    iconUrl: redPinUrl,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                })
            }).addTo(map).bindPopup("您的目前位置").openPopup();
        });
    } else {
        alert("您的瀏覽器不支援定位功能");
    }
}
loadShelters();
function loadShelters() {
    shelterMarkers.forEach(marker => map.removeLayer(marker)); // 清除現有的標記
    shelterMarkers = [];

    const jsonFilePath = '/static/data/shelterdata.json'; // 指向 JSON 文件

    fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // 解析 JSON
        })
        .then(data => {
            data.forEach((shelter, index) => {
                const latitude = parseFloat(shelter['緯度']);
                const longitude = parseFloat(shelter['經度']);

                // 檢查經緯度是否有效
                if (isNaN(latitude) || isNaN(longitude)) {
                    console.warn(`Invalid latitude or longitude for shelter ${shelter['收容所名稱']} at index ${index}:`, shelter);
                    return; // 跳過無效數據
                }

                // 判斷是否包含指定災害類型
                const disasterTypeString = (shelter['可支援收容災害類型'] || '').trim();
                if (selectedDisasterType && !disasterTypeString.includes(selectedDisasterType)) {
                    return; // 如果不包含指定的災害類型，則跳過
                }

                // 建立地圖標記
                const marker = L.marker([latitude, longitude], {
                    icon: L.icon({
                        iconUrl: yellowPinUrl,
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    }),
                }).addTo(map);

                // 綁定彈出框內容
                marker.bindPopup(`
                    <strong>${shelter['收容所名稱']}</strong><br>
                    地址: ${shelter['地址'] || '未知'}<br>
                    聯絡人: ${shelter['聯絡人'] || '未知'}<br>
                    電話: ${shelter['辦公室電話'] || '未知'}<br>
                    可支援災害類型: ${disasterTypeString || '無'}
                `);

                shelterMarkers.push(marker); // 將標記添加到全局數組
            });
        })
        .catch(error => console.error('Error loading shelter data:', error));
}


//災難篩選功能
function filterShelters() {
    selectedDisasterType = document.getElementById("disasterFilter").value;
    loadShelters();
}

// 視角控制
function resetToStation() {
    map.setView([initialLat, initialLng], 16);
}

function resetPoints() {
    if (startMarker) {
        map.removeLayer(startMarker); // 清除起點標記
        startMarker = null;           // 將 startMarker 設為 null
        startPoint = null;            // 清除起點座標
    }

    if (endMarker) {
        map.removeLayer(endMarker);   // 清除終點標記
        endMarker = null;             // 將 endMarker 設為 null
        endPoint = null;              // 清除終點座標
    }

    if (routeLayer) {
        map.removeLayer(routeLayer);  // 清除路徑
        routeLayer = null;            // 將 routeLayer 設為 null
    }

    // 清除所有禁止通行範圍多邊形
    restrictedAreas.forEach(area => map.removeLayer(area));
    restrictedAreas = [];  // 清空 restrictedAreas 陣列
    currentRestrictedPoints = [];
    
    alert("起點、終點和禁止通行範圍已清空");
}

// 2024/11/22 新增功能
// 處理手動設定範圍的選擇
function toggleRestrictedAreaOptions() {
    const optionsDiv = document.getElementById("restrictedAreaOptions");
    optionsDiv.classList.toggle("expanded");
    if (optionsDiv.style.display === "none") {
        optionsDiv.style.display = "block"; // 展開
    } else {
        optionsDiv.style.display = "none"; // 收起
    }
}

// 上傳範圍文件的功能
function uploadRestrictedFile() {
    // 創建文件選擇器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.geojson,.json'; // 限制上傳文件類型

    // 文件選擇變更事件
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert("請選擇檔案");
            return;
        }

        // 檢查文件類型
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.geojson') && !fileName.endsWith('.json')) {
            alert("請上傳有效的 GeoJSON 或 JSON 檔案");
            return;
        }

        // 讀取文件內容
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const fileContent = JSON.parse(e.target.result); // 解析 JSON
                processGeoJSON(fileContent); // 處理 GeoJSON
            } catch (error) {
                alert("檔案解析失敗，請確認檔案格式是否正確");
                console.error(error);
            }
        };
        reader.readAsText(file);
    });

    // 觸發文件選擇器
    input.click();
}

// 處理 GeoJSON 或 JSON 檔案
function processGeoJSON(geojson) {
    if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        alert("無效的 GeoJSON 格式");
        return;
    }

    // 遍歷所有 Feature
    geojson.features.forEach((feature) => {
        if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
            const coordinates = feature.geometry.coordinates;

            // 根據類型處理
            if (feature.geometry.type === "Polygon") {
                //console.log("測試:", coordinates[0]);
                addRestrictedArea(coordinates[0]); // 單個多邊形
            } else if (feature.geometry.type === "MultiPolygon") {
                //console.log("測試:", polygon[0]);
                coordinates.forEach((polygon) => addRestrictedArea(polygon[0])); // 多個多邊形
            }
        } else {
            console.warn("不支持的幾何類型：", feature.geometry.type);
        }
    });

    alert("範圍文件已成功上傳並解析");
}

// 將多邊形座標添加到地圖
function addRestrictedArea(coordinates) {
    // 確保座標格式為 [lat, lng]
    console.log("座標123:", coordinates);
    const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
    const polygon = L.polygon(latLngs, { color: 'red', fillOpacity: 0.5 }).addTo(map);

    // 添加到 restrictedAreas
    restrictedAreas.push(polygon);
}

async function predictFloodArea() {
    //alert("正在進行淹水範圍預測，請稍候...");

    // 定義 Django 後端的代理 URL
    const url = '/fetch_weather_data/';
    const rainData = { Past6Hr: [], Past12Hr: [], Past24Hr: [] };

    try {
        // 1. 獲取氣象數據
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
        //console.log("天氣數據:", data);

        // 2. 篩選臺南市的測站資料
        const tainanStations = data.records.Station.filter(station => station.GeoInfo.CountyName === "臺南市");
        //console.log("臺南市測站數據:", tainanStations);

        // 3. 收集雨量數據
        tainanStations.forEach(station => {
            const rainfall = station.RainfallElement;
            rainData.Past6Hr.push(parseFloat(rainfall.Past6Hr.Precipitation) || 0);
            rainData.Past12Hr.push(parseFloat(rainfall.Past12hr.Precipitation) || 0);
            rainData.Past24Hr.push(parseFloat(rainfall.Past24hr.Precipitation) || 0);
        });

        // 4. 計算平均降雨量
        const averages = {
            Past6Hr: rainData.Past6Hr.reduce((a, b) => a + b, 0) / rainData.Past6Hr.length,
            Past12Hr: rainData.Past12Hr.reduce((a, b) => a + b, 0) / rainData.Past12Hr.length,
            Past24Hr: rainData.Past24Hr.reduce((a, b) => a + b, 0) / rainData.Past24Hr.length
        };

        console.log("平均降雨量:", averages);

        // 5. 找到最大降雨量的時間段
        const maxRainfall = Math.max(averages.Past6Hr, averages.Past12Hr, averages.Past24Hr);
        const timePeriod = mapTimePeriod(Object.keys(averages).find(key => averages[key] === maxRainfall));
        console.log("最大降雨量:", maxRainfall, "時間段:", timePeriod);

        // 6. 使用降雨量範圍創建虛擬多邊形數據
        const polygons = await generateFloodPolygons(timePeriod, maxRainfall);
        //console.log("生成的多邊形數據:", polygons);
        //7. 繪製多邊形到地圖上 
        // polygons.forEach(polygon => {
        //     L.polygon(polygon.coordinates, {
        //         color: "blue",
        //         fillOpacity: 0.5
        //     }).addTo(map).bindPopup(`Grid Code: ${polygon.gridCode}`);
        // });
        polygons.forEach(polygon => {
            // console.log("test123456:")
            // console.log(polygon.coordinates[0]);
            // addRestrictedArea(polygon.coordinates[0]);
            polygon.coordinates.forEach((nestedCoordinates, index) => {
                console.log(`第 ${index} 个嵌套的 coordinates:`);
                console.log(nestedCoordinates);
        
                // 将嵌套的 coordinates 传递给 addRestrictedArea
                addRestrictedArea(nestedCoordinates);
            });
            
        });
        alert("淹水範圍已成功繪製！");
    } catch (error) {
        console.error("Error predicting flood area:", error);
        alert("預測淹水範圍時發生錯誤。");
    }
}

// 將時間段鍵值轉換為用戶友好的時間表示
function mapTimePeriod(timePeriod) {
    const timeMap = {
        Past6Hr: "6h",
        Past12Hr: "12h",
        Past24Hr: "24h"
    };
    return timeMap[timePeriod] || timePeriod;
}

// 使用降雨量範圍生成虛擬的多邊形數據
async function generateFloodPolygons(timePeriod, maxRainfall) {
    // 模擬 Python 的 `get_shp_name` 邏輯
    const rainRanges = {
        "6h": [150, 250, 350],
        "12h": [200, 300, 400],
        "24h": [200, 350, 500, 650]
    };

    const ranges = rainRanges[timePeriod];
    let rangeIndex = 0;

    for (let i = 0; i < ranges.length; i++) {
        if (maxRainfall < ranges[i]) {
            rangeIndex = i - 1 >= 0 ? i - 1 : 0;
            break;
        }
    }

    const rangeValue = ranges[rangeIndex] || ranges[ranges.length - 1];
    const shapefileName = `${timePeriod}${rangeValue}`;
    console.log("生成的 Shapefile 名稱:", shapefileName);

    try {
        // 從後端獲取多邊形數據
        const response = await fetch(`/get_shapefile/${shapefileName}/`);
        if (!response.ok) {
            throw new Error(`無法加載 shapefile: ${shapefileName}`);
        }

        const polygons = await response.json();
        console.log("從 Shapefile 獲取的多邊形數據:", polygons);

        return polygons;
    } catch (error) {
        console.error("Error loading shapefile polygons:", error);
        alert("無法加載指定的 Shapefile");
        return [];
    }
    // 模擬 Python 的 `del_interior` 和 `save_pol`
    // 創建虛擬的多邊形數據
    const polygons = [
        {
            gridCode: `${shapefileName}-001`,
            coordinates: [
                [120.1, 23.1],
                [120.1, 23.2],
                [120.2, 23.2],
                [120.2, 23.1],
                [120.1, 23.1]
            ]
        },
        {
            gridCode: `${shapefileName}-002`,
            coordinates: [
                [120.3, 23.3],
                [120.3, 23.4],
                [120.4, 23.4],
                [120.4, 23.3],
                [120.3, 23.3]
            ]
        }
    ];

    return polygons;
}





// 初次加載所有避難所
loadShelters();
