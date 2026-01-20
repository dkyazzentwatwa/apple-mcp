// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "mapkit-directions",
    platforms: [
        .macOS(.v13)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "mapkit-directions",
            dependencies: []
        )
    ]
)
