/**
 * 
 */

var map;
var marker;
var geocoder;
var infowindow;
var latCoord;
var longCoord;
var directionDisplay;
var directionService;
var searchedPosition = [];
var markerClusterer = null;

function success(position) {
	latCoord = position.coords.latitude;
	longCoord = position.coords.longitude;
	// google.maps.event.addDomListener(window, "load", initialize);
	// initialize();
}

function error(msg) {
	/*
	 * var s = document.querySelector('#map-canvas'); s.innerHTML = typeof msg ==
	 * 'string' ? msg : "위치 정보를 허용해 주십시오."; s.className = 'fail';
	 */
	latCoord = 37.423;
	longCoord = -122.08356700000002;
	// alert('에러가 발생하였습니다.');
	initialize();
	//console.log(arguments);
}

function initialize() {
	var mapOptions = {
		zoom : 15,
		center : new google.maps.LatLng(latCoord, longCoord),
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	infowindow = new google.maps.InfoWindow();

	// initialize marker position
	var marker = new google.maps.Marker({
		position : new google.maps.LatLng(latCoord, longCoord),
		map : map
	});

	// insert event listener here
	google.maps.event.addListener(map,'click',function(event) {
		geocoder.geocode({'latLng' : event.latLng},
			function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					// set the map center to the
					// latlng where the user clicked
					// on map
					map.setCenter(event.latLng);

					// place the marker the latlng
					// where the user clicked on map
					marker
							.setPosition(event.latLng);

					// display formatted address in
					// info window when marker is
					// clicked
					infowindow
							.setContent(results[0].formatted_address);
					document
							.getElementById('address').value = results[0].formatted_address;
					infowindow.open(map, marker);

					document
							.getElementById('modalLatlng').innerHTML = "<img src='https://maps.googleapis.com/maps/api/streetview?size=500x500&location="
							+ event.latLng
							+ "&heading=151.78&pitch=-0.76&key=AIzaSyBsYVLaGllEz-XZYoF6xv_wqPsrG0k7oFs"
							+ "'>";
				} else {
					alert("Geocoder failed due to: "
							+ status);
				}
			});
					});

	geocoder = new google.maps.Geocoder();
	document.getElementById("directions-panel").innerHTML = "";

}

function placeSearchBox(param) {

	// Create the search box and link it to the UI element.
	// alert(param)
	var input;
	if (typeof param === 'undefined') {
		input = document.getElementById('building');
	} else if (param == '[object HTMLInputElement]') {
		input = param;
	} else if (typeof param !== 'undefined') {
		input = document.getElementById(param);
	}
	input = param;
	var searchBox = new google.maps.places.SearchBox(input);
	/* map.controls[google.maps.ControlPosition.TOP_LEFT].push(input); */

	// Bias the SearchBox results towards current map's viewport.
	map.addListener('bounds_changed', function() {
		searchBox.setBounds(map.getBounds());
	});

	var markers = [];
	// [START region_getplaces]
	// Listen for the event fired when the user selects a prediction and
	// retrieve
	// more details for that place.
	searchBox
			.addListener(
					'places_changed',
					function() {
						var places = searchBox.getPlaces();

						if (places.length == 0) {
							return;
						}

						// Clear out the old markers.
						markers.forEach(function(marker) {
							// marker.setMap(null);
						});
						markers = [];

						// For each place, get the icon, name and location.
						var bounds = new google.maps.LatLngBounds();
						places
								.forEach(function(place) {
									var icon = {
										url : place.icon,
										size : new google.maps.Size(71, 71),
										origin : new google.maps.Point(0, 0),
										anchor : new google.maps.Point(17, 34),
										scaledSize : new google.maps.Size(25,
												25)
									};

									// Create a marker for each place.
									var marker = new google.maps.Marker({
										position : new google.maps.LatLng(
												place.geometry.location),
										map : map
									});

									map.setCenter(place.geometry.location);
									marker.setPosition(place.geometry.location);
									searchedPosition[0] = place.geometry.location
											.lat();
									searchedPosition[1] = place.geometry.location
											.lng();
									document.getElementById('modalLatlng').innerHTML = "<img src='https://maps.googleapis.com/maps/api/streetview?size=500x500&location="
											+ searchedPosition[0]
											+ ","
											+ searchedPosition[1]
											+ "&heading=151.78&pitch=-0.76&key=AIzaSyBsYVLaGllEz-XZYoF6xv_wqPsrG0k7oFs"
											+ "'>";

									if (place.geometry.viewport) {
										// Only geocodes have viewport.
										bounds.union(place.geometry.viewport);
									} else {
										bounds.extend(place.geometry.location);
									}
								});
						map.fitBounds(bounds);
						map.setZoom(15);
					});
	// [END region_getplaces]
}

/* Search by address */
function geocodeAddress(geocoder, resultsMap) {
	initialize();
	var address = document.getElementById('address').value;
	geocoder
			.geocode(
					{
						'address' : address
					},
					function(results, status) {
						if (status === google.maps.GeocoderStatus.OK) {
							resultsMap.setCenter(results[0].geometry.location);
							map.setCenter(results[0].geometry.location);
							marker.setPosition(results[0].geometry.location);
							searchedPosition[0] = results[0].geometry.location
									.lat();
							searchedPosition[1] = results[0].geometry.location
									.lng();
							document.getElementById('modalLatlng').innerHTML = "<img src='https://maps.googleapis.com/maps/api/streetview?size=500x500&location="
									+ searchedPosition[0]
									+ ","
									+ searchedPosition[1]
									+ "&heading=151.78&pitch=-0.76&key=AIzaSyBsYVLaGllEz-XZYoF6xv_wqPsrG0k7oFs"
									+ "'>";
							/* alert(searchedPosition[0]); */
							infowindow.setContent(results[0].formatted_address);
							infowindow.open(map, marker);
						} else {
							alert('주소 검색이 다음과 같은 이유로 실패했습니다: ' + status);
						}
					});
}

/* Search by coordinates */
function geocodeLatLng(geocoder, map, infowindow) {
	var input = document.getElementById('latlng').value;
	searchedPosition = input.split(',', 2);
	var latlng = {
		lat : parseFloat(searchedPosition[0]),
		lng : parseFloat(searchedPosition[1])
	};
	geocoder
			.geocode(
					{
						'latLng' : latlng
					},
					function(results, status) {
						if (status === google.maps.GeocoderStatus.OK) {
							map.setCenter(results[1].geometry.location);
							if (results[1]) {
								document.getElementById('modalLatlng').innerHTML = "<img src='https://maps.googleapis.com/maps/api/streetview?size=500x500&location="
										+ searchedPosition[0]
										+ ","
										+ searchedPosition[1]
										+ "&heading=151.78&pitch=-0.76&key=AIzaSyBsYVLaGllEz-XZYoF6xv_wqPsrG0k7oFs"
										+ "'>";
								map.setZoom(11);
								marker = new google.maps.Marker({
									position : latlng,
									map : map
								});
								infowindow
										.setContent(results[1].formatted_address);
								infowindow.open(map, marker);
							} else {
								window.alert('No results found');
							}
						} else {
							window.alert('Geocoder failed due to: ' + status);
						}
					});
}

/* Direction */
function showDirections() {
	initialize();
	var mapOptions = {
		zoom : 9,
		center : new google.maps.LatLng(-34.397, 150.644),
		mapTypeId : google.maps.MapTypeId.ROADMAP
	};

	var rendererOptions = {
		draggable : true
	};

	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	// create directionsService object here
	directionsService = new google.maps.DirectionsService();

	// setup directionsDisplay object here
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);

	calculateAndDisplayRoute(directionsService, directionsDisplay);

}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
	var waypts = [];
	var waypointsArray = document.getElementsByClassName('waypoints');
	for (var i = 0; i < waypointsArray.length; i++) {
		waypts.push({
			location : waypointsArray[i].value,
			stopover : true
		});
	}

	var request = {
		origin : document.getElementById("path-start").value,
		destination : document.getElementById("path-end").value,
		waypoints : waypts,
		travelMode : google.maps.DirectionsTravelMode.DRIVING
	};

	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
		}
	});

	directionsDisplay.setPanel(document.getElementById('directions-panel'));
	var request = {
		origin : document.getElementById("path-start").value,
		destination : document.getElementById("path-end").value,
		travelMode : google.maps.DirectionsTravelMode.DRIVING
	};
}

/* fusion table feture */
function setFusion() {
	map = new google.maps.Map(document.getElementById('map-canvas'), {
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
}

/* fusion table heatmap */
function setHeat() {
	map = new google.maps.Map(document.getElementById('map-canvas'), {
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
}

/* Get current Position when starts */
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(success, error);
} else {
	error('지원하지 않습니다.');
}

/* Autocomplete */
function auto(typedInput) {
	$(function() {
		var autocomplete;
		var geocoder;
		var input = typedInput;
		// var input = document.getElementById('address');
		var options = {
		/* types: ['(regions)'] */// (cities)
		};

		autocomplete = new google.maps.places.Autocomplete(input, options);
	})
}

function removeWaypoint(obj) {
	$(obj).prev().remove();
	$(obj).remove();
}

function removeAllWaypoints() {
	$('.waypoints').remove();
	$('.removeWaypointsButton').remove();
}

function initPath() {
	document.getElementById('path-start').value = "";
	document.getElementById('path-end').value = "";
	if (document.getElementById('waypoints') !== null) {
		document.getElementById('waypoints').value = "";
	}
	if (document.getElementById('directions-panel') !== null) {
		document.getElementById('directions-panel').innerHTML = "";
	}
}

$(document).ready(function() {
	var addPathText;
	addPathText = '<input placeholder="경유지를 선택해주세요." onfocus="placeSearchBox(this)" type="text" '
	addPathText += 'class="form-control waypoints" id="waypoints"><button type="button" class="removeWaypointsButton" '
	addPathText += 'onclick="removeWaypoint(this)"> - </a>'

	$('#addPath').on('click', function() {
		$('#path-end').before(addPathText);
	})
})