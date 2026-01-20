import Foundation
import MapKit
import CoreLocation

// MARK: - Data Structures

struct RouteRequest: Codable {
    let fromAddress: String
    let toAddress: String
    let transportType: String
    let includeAlternatives: Bool?
}

struct RouteResponse: Codable {
    let success: Bool
    let error: String?
    let distance: Double?
    let expectedTravelTime: Double?
    let steps: [RouteStep]?
    let polyline: String?
    let alternativeRoutes: [AlternativeRoute]?
}

struct RouteStep: Codable {
    let instructions: String
    let distance: Double
    let notice: String?
}

struct AlternativeRoute: Codable {
    let distance: Double
    let expectedTravelTime: Double
    let name: String?
}

// MARK: - Main Logic

func geocodeAddress(_ address: String) async throws -> CLLocationCoordinate2D {
    let geocoder = CLGeocoder()
    let placemarks = try await geocoder.geocodeAddressString(address)

    guard let location = placemarks.first?.location else {
        throw NSError(domain: "Geocoding", code: 1, userInfo: [
            NSLocalizedDescriptionKey: "Could not geocode address: \(address)"
        ])
    }

    return location.coordinate
}

func calculateRoute(
    from: CLLocationCoordinate2D,
    to: CLLocationCoordinate2D,
    transportType: String,
    requestAlternates: Bool
) async throws -> MKDirections.Response {
    let request = MKDirections.Request()
    request.source = MKMapItem(placemark: MKPlacemark(coordinate: from))
    request.destination = MKMapItem(placemark: MKPlacemark(coordinate: to))

    // Set transport type
    switch transportType.lowercased() {
    case "walking":
        request.transportType = .walking
    case "transit":
        request.transportType = .transit
    case "driving", "automobile":
        request.transportType = .automobile
    default:
        request.transportType = .automobile
    }

    request.requestsAlternateRoutes = requestAlternates

    let directions = MKDirections(request: request)
    return try await directions.calculate()
}

func encodePolyline(_ route: MKRoute) -> String {
    // Simple polyline encoding (lat,lng pairs separated by semicolons)
    // For a more compact encoding, could implement Google's polyline algorithm
    let coordinates = route.polyline.points()
    let coordinateArray = (0..<route.polyline.pointCount).map { coordinates[$0].coordinate }

    return coordinateArray.map { "\($0.latitude),\($0.longitude)" }.joined(separator: ";")
}

func processRouteRequest(_ request: RouteRequest) async -> RouteResponse {
    do {
        // Geocode addresses
        let fromCoordinate = try await geocodeAddress(request.fromAddress)
        let toCoordinate = try await geocodeAddress(request.toAddress)

        // Calculate routes
        let response = try await calculateRoute(
            from: fromCoordinate,
            to: toCoordinate,
            transportType: request.transportType,
            requestAlternates: request.includeAlternatives ?? false
        )

        guard let primaryRoute = response.routes.first else {
            return RouteResponse(
                success: false,
                error: "No route found",
                distance: nil,
                expectedTravelTime: nil,
                steps: nil,
                polyline: nil,
                alternativeRoutes: nil
            )
        }

        // Extract route steps
        let steps = primaryRoute.steps.map { step in
            RouteStep(
                instructions: step.instructions,
                distance: step.distance,
                notice: step.notice
            )
        }

        // Extract alternative routes
        var alternativeRoutes: [AlternativeRoute]? = nil
        if response.routes.count > 1 {
            alternativeRoutes = response.routes.dropFirst().map { route in
                AlternativeRoute(
                    distance: route.distance,
                    expectedTravelTime: route.expectedTravelTime,
                    name: route.name
                )
            }
        }

        // Encode polyline
        let polyline = encodePolyline(primaryRoute)

        return RouteResponse(
            success: true,
            error: nil,
            distance: primaryRoute.distance,
            expectedTravelTime: primaryRoute.expectedTravelTime,
            steps: steps,
            polyline: polyline,
            alternativeRoutes: alternativeRoutes
        )

    } catch {
        return RouteResponse(
            success: false,
            error: error.localizedDescription,
            distance: nil,
            expectedTravelTime: nil,
            steps: nil,
            polyline: nil,
            alternativeRoutes: nil
        )
    }
}

// MARK: - Entry Point

@main
struct MapKitDirections {
    static func main() async {
        // Read JSON from stdin
        let input = FileHandle.standardInput.readDataToEndOfFile()

        guard let request = try? JSONDecoder().decode(RouteRequest.self, from: input) else {
            let errorResponse = RouteResponse(
                success: false,
                error: "Invalid JSON input",
                distance: nil,
                expectedTravelTime: nil,
                steps: nil,
                polyline: nil,
                alternativeRoutes: nil
            )

            if let jsonData = try? JSONEncoder().encode(errorResponse),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
            }

            exit(1)
        }

        // Process request
        let response = await processRouteRequest(request)

        // Output JSON to stdout
        if let jsonData = try? JSONEncoder().encode(response),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
        }

        exit(response.success ? 0 : 1)
    }
}
