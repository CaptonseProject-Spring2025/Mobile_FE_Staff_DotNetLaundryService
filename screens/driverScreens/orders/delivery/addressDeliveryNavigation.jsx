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
import MapboxGL from "@rnmapbox/maps";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Card } from "react-native-paper";
import * as Location from "expo-location";
import { useRoute } from "@react-navigation/native";
import trackingService from "../../../../api/services/trackingService";

LogBox.ignoreLogs([
  "ViewTagResolver",
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
]);

const AddressDeliveryNavigateMap = () => {
  const route = useRoute();
  const {
    userData,
    showDrivingView: initialDrivingView,
    showTravelingArrow: initialTravelingArrow,
    orderId,
  } = route.params || {};

  const MAPBOX_ACCESS_TOKEN =
    "pk.eyJ1IjoidGhhbmhidCIsImEiOiJjbThrY3U3cm4wOWliMm5zY2YxZHphcGhxIn0.XFTGLomzaK65jyUYJCLUZw";

  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isDrivingView, setIsDrivingView] = useState(
    initialDrivingView || false
  );
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showTravelingArrow, setShowTravelingArrow] = useState(
    initialTravelingArrow || false
  );
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentDriverLocation, setCurrentDriverLocation] = useState(null);
  const [lineUpdateKey, setLineUpdateKey] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  const cameraRef = useRef(null);
  const mapViewRef = useRef(null);
  const arrowPositionRef = useRef(new Animated.Value(0)).current;
  // Request permission and get current location
  useEffect(() => {
    let zoomTimerId;

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
          if (userData && userData.deliveryLatitude && userData.deliveryLongitude) {
            setUserLocation({
              latitude: userData.deliveryLatitude,
              longitude: userData.deliveryLongitude,
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

    // Cleanup function to clear the timeout when component unmounts
    return () => {};
  }, [userData]);

  // start SignalR connection when mounting
  useEffect(() => {
    if (orderId) {
      // Create handler functions that can be referenced for cleanup
      const handleError = (error) => {
        console.error("Tracking error:", error);
      };

      trackingService.startConnection(orderId);
      trackingService.onError(handleError);

      return () => {
        trackingService.stopConnection();
        trackingService.removeErrorListener(handleError);
      };
    }
  }, [orderId]);

  // Create a location tracking effect that updates more frequently
  useEffect(() => {
    let locationSubscription = null;
    let isMounted = true;

    const startLocationTracking = async () => {
      if (permissionStatus === "granted") {
        try {
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Highest,
              distanceInterval: 30, // Update every 30 meters
            },
            (location) => {
              if (!isMounted) return;

              const newLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              };

              setCurrentDriverLocation(newLocation);
              setCurrentLocation(newLocation);

              // send live location over SignalR
              if (orderId) {
                console.log("Sending live location:", newLocation);
                trackingService.sendLocation(
                  location.coords.latitude,
                  location.coords.longitude
                );
              }

              // Update driver location state
              setDriverLocation(newLocation);

              // //Trigger line update
              setLineUpdateKey((prev) => prev + 1);
            }
          );

          locationSubscription = subscription;
        } catch (error) {
          console.error("Error setting up location tracking:", error);
        }
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [permissionStatus, orderId]);

  // Force regular updates of the direct line but less frequently
  useEffect(() => {
    let isMounted = true;

    const updateInterval = setInterval(() => {
      if (isMounted) {
        setForceUpdate((prev) => prev + 1);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(updateInterval);
    };
  }, []);

  // Update the direct line when forceUpdate changes
  useEffect(() => {
    if (currentDriverLocation && userLocation) {
      setLineUpdateKey((prev) => prev + 1);
    }
  }, [forceUpdate, currentDriverLocation, userLocation]);

  // Get route when either location changes significantly
  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      if (driverLocation && userLocation && !isFetchingRoute) {
        if (isMounted) {
          fetchDirectionsRoute();
        }
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [driverLocation, userLocation]);

  const fetchDirectionsRoute = async () => {
    if (isFetchingRoute) return;

    try {
      setIsFetchingRoute(true);
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${driverLocation.longitude},${driverLocation.latitude};${userLocation.longitude},${userLocation.latitude}`,
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
    } finally {
      setIsFetchingRoute(false);
    }
  };
  // Using a ref to keep track of the component's mount status
  const isMounted = useRef(true);

  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLocationUpdate = (location) => {
    if (!location || !location.coords || !isMounted.current) return;

    const newLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Cập nhật vị trí hiện tại
    setCurrentDriverLocation(newLocation);
    setCurrentLocation(newLocation);
  };

  // Start navigation animation if in driving view automatically
  useEffect(() => {
    let animationRef = null;

    if (isDrivingView && routeCoordinates.length > 0 && duration) {
      setShowTravelingArrow(true);
      animationRef = Animated.timing(arrowPositionRef, {
        toValue: 1,
        duration: duration * 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      animationRef.start();
    }

    // Clean up animation when component unmounts or dependencies change
    return () => {
      if (animationRef) {
        animationRef.stop();
      }
    };
  }, [isDrivingView, routeCoordinates.length, duration, arrowPositionRef]);

  // Clean up MapboxGL resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop any active camera animations
      if (cameraRef.current) {
        try {
          // Reset camera settings to stop any animations
          cameraRef.current.setCamera({
            followUserLocation: false,
            followUserMode: MapboxGL.UserTrackingModes.None,
          });
        } catch (error) {
          console.log("Error cleaning up camera:", error);
        }
      }
    };
  }, []);

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
            styleURL={MapboxGL.StyleURL.Light}
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
              zoomLevel={isDrivingView ? 18 : 14}
              centerCoordinate={
                !isDrivingView && driverLocation
                  ? [driverLocation.longitude, driverLocation.latitude]
                  : undefined
              }
              animationMode="flyTo"
              animationDuration={1000}
            />

            <MapboxGL.UserLocation
              visible={true}
              showsUserHeadingIndicator={isDrivingView}
              onUpdate={handleLocationUpdate}
            />

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
                  <Text style={styles.userAddress} numberOfLines={2}>
                    Địa chỉ:{" "}
                    {userData?.deliveryAddressDetail || "No address details"}
                  </Text>
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
    fontSize: 16,
    fontWeight: "bold",
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

export default AddressDeliveryNavigateMap;
