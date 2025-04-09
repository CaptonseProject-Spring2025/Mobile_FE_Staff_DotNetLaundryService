import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  LogBox,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import MapboxGL, { NativeUserLocation } from "@rnmapbox/maps";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Avatar, Card } from "react-native-paper";
import * as Location from "expo-location";
import { useRoute } from "@react-navigation/native";

LogBox.ignoreLogs([
  "ViewTagResolver",
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
]);

const AddressNavigateMap = () => {
  const route = useRoute();
  const { userData } = route.params || {};

  const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1IjoidGhhbmhidCIsImEiOiJjbThrY3U3cm4wOWliMm5zY2YxZHphcGhxIn0.XFTGLomzaK65jyUYJCLUZw";

  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isDrivingView, setIsDrivingView] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showTravelingArrow, setShowTravelingArrow] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [lineUpdateKey, setLineUpdateKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);

  const cameraRef = useRef(null);
  const mapViewRef = useRef(null);
  const arrowPositionRef = useRef(new Animated.Value(0)).current;

  // Request permission and get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === "granted") {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });

          setDriverLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });

          // Set user location from data passed in route params
          if (userData && userData.pickupLatitude && userData.pickupLongitude) {
            setUserLocation({
              latitude: userData.pickupLatitude,
              longitude: userData.pickupLongitude,
            });
          }
        } catch (error) {
          console.error("Error getting location:", error);
          // Fallback to default driver location
          setDriverLocation({
            latitude: 10.78535,
            longitude: 106.61849,
          });
        }
      }
    })();
  }, [userData]);

  // Create a location tracking effect that updates more frequently
  useEffect(() => {
    let locationSubscription;

    if (permissionStatus === "granted") {
      locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 10,
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentDriverLocation(newLocation);
          setDriverLocation(newLocation); // Update driver location to trigger route recalculation
          // Force update of direct line by incrementing key
          setLineUpdateKey((prev) => prev + 1);
        }
      );
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.then((sub) => sub.remove());
      }
    };
  }, [permissionStatus]);

  // Force regular updates of the direct line
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  // Update the direct line when forceUpdate changes
  useEffect(() => {
    if (currentDriverLocation && userLocation) {
      setLineUpdateKey((prev) => prev + 1);
    }
  }, [forceUpdate, currentDriverLocation, userLocation]);

  // Get route when either location changes
  useEffect(() => {
    if (driverLocation && userLocation) {
      fetchRoute();
    }
  }, [driverLocation, userLocation]);

  const fetchRoute = async () => {
    try {
      setIsLoading(true);

      // Format coordinates for Optimization API
      const coordinates = [
        `${driverLocation.longitude},${driverLocation.latitude}`,
        `${userLocation.longitude},${userLocation.latitude}`,
      ].join(";");

      // Call Mapbox Optimization API
      const response = await axios.get(
        `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            geometries: "geojson",
            overview: "full",
            steps: true,
            source: "first",
            destination: "last",
            roundtrip: false,
          },
        }
      );

      if (response.data.trips && response.data.trips.length > 0) {
        const optimizedTrip = response.data.trips[0];

        const routeGeoJSON = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: optimizedTrip.geometry.coordinates,
          },
        };

        setRouteGeoJSON(routeGeoJSON);
        setDistance((optimizedTrip.distance / 1000).toFixed(1)); // Convert to km
        setDuration(Math.round(optimizedTrip.duration / 60)); // Convert to minutes
        setRouteCoordinates(optimizedTrip.geometry.coordinates);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching optimized route:", error);
      // Fallback to regular directions API if optimization fails
      fetchDirectionsRoute();
    }
  };

  const fetchDirectionsRoute = async () => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.longitude},${driverLocation.latitude};${userLocation.longitude},${userLocation.latitude}`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            geometries: "geojson",
            overview: "full",
            steps: true,
          },
        }
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const routeGeoJSON = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route.geometry.coordinates,
          },
        };

        setRouteGeoJSON(routeGeoJSON);
        setDistance((route.distance / 1000).toFixed(1)); // Convert to km
        setDuration(Math.round(route.duration / 60)); // Convert to minutes
        setRouteCoordinates(route.geometry.coordinates);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching route:", error);
      setIsLoading(false);
    }
  };

  const fitBounds = () => {
    if (!driverLocation || !userLocation || !cameraRef.current) return;

    const bounds = [
      [driverLocation.longitude, driverLocation.latitude],
      [userLocation.longitude, userLocation.latitude],
    ];

    cameraRef.current.fitBounds(bounds[0], bounds[1], 50, 200);
  };

  // When locations change, fit to bounds
  useEffect(() => {
    if (driverLocation && userLocation) {
      setTimeout(fitBounds, 1000);
    }
  }, [driverLocation, userLocation]);

  const handleLocationUpdate = (location) => {
    if (!location || !location.coords) return;

    const newLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Update all location states with the same value
    setCurrentDriverLocation(newLocation);
    setDriverLocation(newLocation);
    setCurrentLocation(newLocation);
    // Trigger line update
    setLineUpdateKey((prev) => prev + 1);
  };

  if (permissionStatus === "denied") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          Quyền truy cập vị trí bị từ chối. Vui lòng bật dịch vụ vị trí để điều
          hướng.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && !routeGeoJSON ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#02A257" />
          <Text style={styles.loadingText}>Đang tải tuyến đường...</Text>
        </View>
      ) : (
        <>
          <MapboxGL.MapView
            ref={mapViewRef}
            style={styles.map}
            compassEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            logoEnabled={false}
            attributionEnabled={false}
            scaleBarEnabled={false}
          >
            <MapboxGL.Camera
              ref={cameraRef}
              followUserLocation={isDrivingView}
              followUserMode={
                isDrivingView
                  ? MapboxGL.UserTrackingModes.FollowWithCourse
                  : MapboxGL.UserTrackingModes.None
              }
              followPitch={isDrivingView ? 60 : 0}
              pitch={isDrivingView ? 60 : 0}
              zoomLevel={isDrivingView ? 17 : 12}
              animationMode="flyTo"
              animationDuration={2000}
            />

            <MapboxGL.UserLocation
              visible={true}
              showsUserHeadingIndicator={isDrivingView}
              onUpdate={handleLocationUpdate}
            />

            {!isDrivingView && driverLocation && (
              <MapboxGL.PointAnnotation
                id="driverLocation"
                coordinate={[driverLocation.longitude, driverLocation.latitude]}
                title="You"
              >
                <View style={styles.driverMarker}>
                  <View style={styles.driverMarkerInner} />
                </View>
              </MapboxGL.PointAnnotation>
            )}

            {userLocation && (
              <MapboxGL.PointAnnotation
                id="userLocation"
                coordinate={[userLocation.longitude, userLocation.latitude]}
                title="Customer"
              >
                <View style={styles.userMarker}>
                  <Ionicons name="location" size={24} color="#FF5252" />
                </View>
              </MapboxGL.PointAnnotation>
            )}

            {routeGeoJSON && (
              <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
                <MapboxGL.LineLayer
                  id="routeLayer"
                  style={{
                    lineWidth: isDrivingView ? 6 : 4,
                    lineColor: "#02A257",
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              </MapboxGL.ShapeSource>
            )}

            {/* Use LiveLine to create constantly updating line */}
            {showTravelingArrow && routeCoordinates.length > 0 && (
              <MapboxGL.ShapeSource
                id="arrowSource"
                shape={{
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      properties: {},
                      geometry: {
                        type: "Point",
                        coordinates:
                          routeCoordinates[
                            Math.floor(
                              arrowPositionRef.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, routeCoordinates.length - 1],
                              })._value * routeCoordinates.length
                            ) % routeCoordinates.length
                          ],
                      },
                    },
                  ],
                }}
              >
                <MapboxGL.SymbolLayer
                  id="arrowLayer"
                  style={{
                    iconImage: "arrow-right",
                    iconSize: 0.5,
                    iconColor: "#FF5252",
                    iconHaloColor: "#fff",
                    iconHaloWidth: 1,
                    iconRotationAlignment: "map",
                    iconAllowOverlap: true,
                  }}
                />
              </MapboxGL.ShapeSource>
            )}
          </MapboxGL.MapView>

          {/* Navigation instructions panel - only visible in driving view */}
          {isDrivingView && (
            <View style={[styles.navigationPanel, { top: 4 }]}>
              <View style={styles.arrivalInfoContainer}>
                <View style={styles.arrivalDetails}>
                  <Text style={styles.arrivalTitle}>Thời gian đến dự kiến</Text>
                  <Text style={styles.arrivalTime}>
                    {new Date(Date.now() + duration * 60000).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.endNavButton}
                  onPress={() => {
                    setIsDrivingView(false);
                    setTimeout(fitBounds, 500);
                  }}
                >
                  <Text style={styles.endNavButtonText}>Kết thúc</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom user info card - only visible in overview mode */}
          {!isDrivingView && (
            <Card style={styles.bottomCard}>
              <Card.Content>
                <View style={styles.userInfoContainer}>
                  <Avatar.Icon
                    size={50}
                    icon="account"
                    backgroundColor="#02A257"
                  />
                  <View style={styles.userTextInfo}>
                    <Text style={styles.userName}>
                      {userData?.pickupName || "Customer"}
                    </Text>
                    <Text style={styles.userPhone}>
                      {userData?.pickupPhone || "N/A"}
                    </Text>
                    <Text style={styles.userAddress} numberOfLines={2}>
                      {userData?.pickupAddressDetail || "No address details"}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeInfoContainer}>
                  <View style={styles.routeInfoItem}>
                    <Ionicons name="navigate" size={20} color="#02A257" />
                    <Text style={styles.routeInfoText}>
                      {distance || "0"} km
                    </Text>
                  </View>

                  <View style={styles.routeInfoItem}>
                    <Ionicons name="time" size={20} color="#02A257" />
                    <Text style={styles.routeInfoText}>
                      {duration || "0"} phút
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => {
                    setIsDrivingView(true);
                    setShowTravelingArrow(true);
                    Animated.timing(arrowPositionRef, {
                      toValue: 1,
                      duration: duration * 60000,
                      easing: Easing.linear,
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.startButtonText}>Bắt đầu điều hướng</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#02A257",
  },
  errorText: {
    padding: 20,
    fontSize: 16,
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    zIndex: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  driverMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3897f1",
    borderWidth: 2,
    borderColor: "white",
  },
  driverMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3897f1",
  },
  userMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    width: width,
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 5,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  userTextInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userPhone: {
    fontSize: 16,
    color: "#666",
    marginVertical: 2,
  },
  userAddress: {
    fontSize: 14,
    color: "#666",
    flexShrink: 1,
  },
  routeInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeInfoText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "500",
  },
  startButton: {
    backgroundColor: "#02A257",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  headerControls: {
    position: "absolute",
    top: 0,
    width: "100%",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  drivingInfo: {
    flex: 1,
    alignItems: "center",
  },
  drivingInfoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  drivingDestinationText: {
    fontSize: 14,
    color: "#666",
  },
  navigationPanel: {
    width: "100%",
    backgroundColor: "white",
    padding: 10,
    mariginHorizontal: 10,
    borderRadius: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  maneuverContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  maneuverIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  maneuverDetails: {
    marginLeft: 10,
  },
  maneuverText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  maneuverDistance: {
    fontSize: 14,
    color: "#666",
  },
  drivingBackButton: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  roadContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  roadStrip: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
  },
  roadLine: {
    width: 2,
    height: 20,
    backgroundColor: "#02A257",
  },
  carIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#02A257",
  },
  arrivalInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  arrivalDetails: {
    flex: 1,
  },
  arrivalTitle: {
    fontSize: 14,
    color: "#666",
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: "bold",
  },
  endNavButton: {
    backgroundColor: "#FF5252",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  endNavButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  arrow: {
    position: "absolute",
    width: 24,
    height: 24,
  },
});

export default AddressNavigateMap;
