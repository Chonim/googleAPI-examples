$(function(){

	var map;				
	var marker;				
	var geocoder 
	var infowindow;
	var latCoord;
	var longCoord;
	var directionDisplay;
	var directionService;
	var searchedPosition = [];
	var markerClusterer = null;
	var checkSearchBox = false;
	var place;

	/*street map 버튼을 눌렀을 경우의 처리*/
	/*각 nav에서 검색에 따른 결과로 독적으로 처리되므로, on으로 처리*/
	$(document).on("click",".btn-info",function(){
		searchedPosition[0] = map.getCenter().lat();
		searchedPosition[1] = map.getCenter().lng();
		alert(searchedPosition[0]+","+searchedPosition[1]);
		$("#modalLatlng").html(
			"<img src='https://maps.googleapis.com/maps/api/streetview?size=500x500&location="
			+ searchedPosition[0] + "," + searchedPosition[1]
			+ "&heading=151.78&pitch=-0.76&key=AIzaSyBsYVLaGllEz-XZYoF6xv_wqPsrG0k7oFs"
			+ "'>");	
	});

	/*길찾기에서 경유지 제거 버튼(-) 눌렀을 경우의 처리*/
	/*경유지 추가로 인해 동적으로 생성되는 제거 버튼을 on을 이용하여 처리*/
	$(document).on("click",".removeWaypointsButton",function(){
		$(this).prev().remove();
		$(this).remove();
	});

	/*문서가 모두 읽힌 이후의 처리*/
	$(document).ready(function(){

		/* 초기 세팅.  go to initialize() */
		google.maps.event.addDomListener(window, 'load', initialize);

		/* 각 입력 폼에서 검색중일 경우, searchBox를 달아서 검색의 편의성 제공*/
		$('#address').keypress(function(){
			var searchBox = new google.maps.places.Autocomplete($('#address')[0]);
			searchBox.addListener('place_changed', function() {
				checkSearchBox = true;
				place =searchBox.getPlace();
				if (!place.geometry) {
					window.alert("Autocomplete's returned place contains no geometry");
					return;
				}
				if ($('#address').val().length == 0) {
					checkSearchBox = false;
					return;
				}
			});
		});
		/* 각 입력 폼에서 검색중일 경우, searchBox를 달아서 검색의 편의성 제공*/
		$('#path-start').keypress(function(){
			var searchBox = new google.maps.places.SearchBox($('#path-start')[0]);
		});
		/* 각 입력 폼에서 검색중일 경우, searchBox를 달아서 검색의 편의성 제공*/
		$('#path-end').keypress(function(){
			var searchBox = new google.maps.places.SearchBox($('#path-end')[0]);
		});

		/*건물, 주소 검색 버튼을 누른 경우*/
		$('#addressSearch').click(function(){
			var address = $('#address').val();
			var service = new google.maps.places.PlacesService(map);
			//수기로 입력하여 처리한 경우 지오코딩 과정을 거쳐 처리
			if (checkSearchBox==false){
				geocoder.geocode({'address' : address},
					function(results, status) {
						if (status === google.maps.GeocoderStatus.OK) {
							map.setCenter(results[0].geometry.location);
							marker.setPosition(results[0].geometry.location);
							infowindow.setContent(results[0].formatted_address);
							infowindow.open(map, marker);
						} 
					});
			//자동완성으로 입력한 경우 그 값을 가지고 처리			
			}else{
				map.setCenter(place.geometry.location);
				marker.setPosition(place.geometry.location);
				infowindow.setContent(place.formatted_address);
				infowindow.open(map, marker);
			}		
		});

		/*좌표 검색 버튼을 누른 경우*/
		$('#latlngSearch').click(function(){
			var input = $('#latlng').val();
			searchedPosition = input.split(',', 2);
			var latlng = {	lat : parseFloat(searchedPosition[0]),
				lng : parseFloat(searchedPosition[1])		};
				geocoder.geocode({'latLng' : latlng},
					function(results, status) {
						if (status === google.maps.GeocoderStatus.OK) {

							if (results[1]) {
								map.setCenter(results[1].geometry.location);
								marker.setPosition(results[1].geometry.location);
								infowindow.setContent(results[1].formatted_address);
								infowindow.open(map, marker);
							} else {
								window.alert('없는 좌표입니다.');
							}
						} else {
							window.alert('Geocoder failed due to: ' + status);
						}
					});
			});

		/* 경유지 추가 버튼을 누른 경우 */
		$('#addPath').click(function() {
			// 경유지 입력하는 Form 객체
			var newInput = $("<input>");
			newInput.attr({
				"type" : "text",
				"placeholder" : "경유지를 선택해주세요", 
				"class" : "form-control waypoints"
			});
			var searchBox = new google.maps.places.SearchBox($(newInput)[0]);

			// 경유지 삭제하는 Button 객체 생성
			var newRemoveBtn = $("<input>");
			newRemoveBtn.attr({
				"type" : "button",
				"value" : "-", 
			});
			newRemoveBtn.addClass("removeWaypointsButton");

			//조립
			$('#path-end').before(newInput ,newRemoveBtn);
		});

		/* 경유지 모두 제거 버튼을 누른 경우 */
		$('#removeAllWaypoints').click(function() {
			$('.waypoints').remove();
			$('.removeWaypointsButton').remove();
		});


		/* 경유지 초기화 버튼을 누른 경우 */
		$('#initPath').click(function(){
			$('#path-start').val("");
			$('#path-end').val("");
			$('.waypoints').val("");
			$('#directions-panel').html("");
		});

		/* 길찾기 버튼을 누른 경우 */	
		$('#showDirections').click(function(){
			$('#directions-panel').html("");
			map = new google.maps.Map($('#map-canvas')[0]); //구글 맵을 사용할 타겟
			var rendererOptions = { draggable : true };
			// create directionsService object here
			directionsService = new google.maps.DirectionsService();
			// setup directionsDisplay object here
			directionsDisplay = new google.maps.DirectionsRenderer();
			directionsDisplay.setMap(map);

			var waypts = [];
			var waypointsArray = $('.waypoints') //each 함수
			for (var i = 0; i < waypointsArray.length; i++) {
				waypts.push({
					location : waypointsArray[i].value,
					stopover : true
				});
			}

			var request = {
				origin : $("#path-start").val(),
				destination : $("#path-end").val(),
				waypoints : waypts,
				travelMode : google.maps.DirectionsTravelMode.DRIVING
			};
		
			directionsService.route(request, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
				}
			});

			var $panel = $('#directions-panel')[0];
			directionsDisplay.setPanel($panel);
		});

		/* 퓨전테이블의 fetureBTN 이 눌린 경우 */
		$('#fetureBtn').click(function(){
			map = new google.maps.Map($('#map-canvas')[0], {
				center : {
					lat : 35.570975,
					lng : 127.977759
				},
				zoom : 7
			});
			
			var layer = new google.maps.FusionTablesLayer({
				query : {
					select : 'geoaddr',
					from : '1QMYiysX3L_xCPK767abDBAeaKbX4iwfjZfdnheUY'
				}
			});
			layer.setMap(map);
		});

		/* 퓨전테이블의 heatBtn 이 눌린 경우 */
		$('#heatBtn').click(function(){
			map = new google.maps.Map($('#map-canvas')[0], {
				center : {
					lat : 37.570975,
					lng : 126.977759
				},
				zoom : 3
			});

			var layer = new google.maps.FusionTablesLayer({
				query : {
					select : 'geoaddr',
					from : '1QMYiysX3L_xCPK767abDBAeaKbX4iwfjZfdnheUY'
				},
				heatmap : {
					enabled : true,
					radius : 20
				}
			});
			layer.setMap(map);
		});
	})//jQuery-end	

	/*초기 세팅 함수*/
	function initialize(){
		if($("#map-canvas").length) {
			var mapOptions = { //구글 맵 옵션 설정
				zoom : 16, //기본 확대율
				center : new google.maps.LatLng(37.5651, 126.98955), // 지도 중앙 위치
				scrollwheel : false, //마우스 휠로 확대 축소 사용 여부
				mapTypeControl : false //맵 타입 컨트롤 사용 여부
			};

			map = new google.maps.Map($('#map-canvas')[0], mapOptions); //구글 맵을 사용할 타겟
			marker = new google.maps.Marker({ //마커 설정
				map : map,
				position : map.getCenter(), //마커 위치

			});
			geocoder = new google.maps.Geocoder();
			infowindow = new google.maps.InfoWindow();
			google.maps.event.addDomListener(window, "resize", function() { //리사이즈에 따른 마커 위치
				var center = map.getCenter();
				google.maps.event.trigger(map, "resize");
				map.setCenter(center); 
		});
	}//if-end
	}//function-end
});
