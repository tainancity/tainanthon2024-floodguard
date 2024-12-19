const apiKey = '5b3ce3597851110001cf62488b293649a8bb4541a457c66d7e4581ef';  // 請替換為您的 OpenRouteService API Key

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
        L.polygon(currentRestrictedPoints, { color: 'red' }).addTo(map);
    }
}

// 完成當前禁止通行區域的繪製
function finishRestrictedArea() {
    if (currentRestrictedPoints.length > 2) {
        restrictedAreas.push([...currentRestrictedPoints]);  // 將當前多邊形添加到範圍清單
        L.polygon(currentRestrictedPoints, { color: 'red', fillOpacity: 0.5 }).addTo(map);
        currentRestrictedPoints = [];  // 清空以便繪製下一個
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

    // 確保 restrictedPoints 形成閉合多邊形並交換經緯度
    if (restrictedPoints && restrictedPoints.length > 0) {
        const firstPoint = restrictedPoints[0];
        const lastPoint = restrictedPoints[restrictedPoints.length - 1];
        
        // 檢查是否閉合，不是則添加首點至尾部
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
            restrictedPoints.push(firstPoint);
        }

        // 交換經緯度
        restrictedPoints = restrictedPoints.map(point => [point[1], point[0]]);
    }

    const avoidPolygons = restrictedPoints && restrictedPoints.length ? {
        type: "Polygon",
        coordinates: [restrictedPoints]
    } : null;

    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}`;
    const body = {
        coordinates: [[startPoint[1], startPoint[0]], [endPoint[1], endPoint[0]]],
        options: avoidPolygons ? { avoid_polygons: avoidPolygons } : {}
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

// 從 API 獲取避難所資料並添加標記
function loadShelters() {
    shelterMarkers.forEach(marker => map.removeLayer(marker)); // 清除現有的標記
    shelterMarkers = [];

    fetch('/api/shelters/')
        .then(response => response.json())
        .then(data => {
            data.forEach(shelter => {
                if (selectedDisasterType && !shelter.disaster_support_types.includes(selectedDisasterType)) {
                    return;
                }

                var marker = L.marker([shelter.latitude, shelter.longitude], {
                    icon: L.icon({
                        iconUrl: yellowPinUrl,
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    })
                }).addTo(map);

                marker.bindPopup(`
                    <strong>${shelter.name}</strong><br>
                    最大容納人數: ${shelter.max_capacity}<br>
                    地址: ${shelter.address}<br>
                    聯絡人: ${shelter.contact_person}<br>
                    辦公室電話: ${shelter.office_phone}<br>
                    可支援災害類型: ${shelter.disaster_support_types}
                `);

                shelterMarkers.push(marker);
            });
        })
        .catch(error => console.error('Error fetching shelter data:', error));
}

// 災難篩選功能
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
    if (restrictedArea) {
        map.removeLayer(restrictedArea);
        restrictedArea = null;
        restrictedPoints = [];  // 清空存儲的範圍點
    }

    alert("起點、終點和禁止通行範圍已清空");
}








// 初次加載所有避難所
loadShelters();
