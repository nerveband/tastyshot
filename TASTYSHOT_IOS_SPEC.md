# TastyShot iOS - Native iOS App Specification

## Project Overview

TastyShot iOS is a native iOS application designed for instant food photography enhancement using AI-powered image editing models. The app leverages native iOS camera capabilities, photo library integration, and system features while maintaining API connectivity to Replicate AI models for professional-quality food photo enhancements.

## Architecture

### Tech Stack
- **Platform**: iOS 16.0+
- **Language**: Swift 5.9+ with SwiftUI
- **UI Framework**: SwiftUI with UIKit integration
- **Camera**: AVFoundation (AVCaptureSession)
- **Photo Management**: PhotosUI, PHPhotoLibrary
- **Networking**: URLSession with async/await
- **Image Processing**: Core Image, Vision Framework
- **Storage**: Core Data + iCloud sync
- **AI Models**: Replicate API integration
- **Background Processing**: BackgroundTasks framework
- **Notifications**: UserNotifications framework

### Project Structure
```
TastyShot-iOS/
├── TastyShot.xcodeproj
├── TastyShot/
│   ├── App/
│   │   ├── TastyShotApp.swift          # App entry point
│   │   ├── ContentView.swift           # Main navigation
│   │   └── AppDelegate.swift           # App lifecycle
│   ├── Views/
│   │   ├── Camera/
│   │   │   ├── CameraView.swift        # Native camera interface
│   │   │   ├── CameraViewModel.swift   # Camera logic
│   │   │   └── CameraPreviewView.swift # Live preview
│   │   ├── Editor/
│   │   │   ├── PhotoEditorView.swift   # AI editing interface
│   │   │   ├── EditorViewModel.swift   # Editing logic
│   │   │   └── ModelSelectionView.swift # AI model picker
│   │   ├── Gallery/
│   │   │   ├── PhotoGalleryView.swift  # Photo management
│   │   │   ├── PhotoDetailView.swift   # Photo detail/share
│   │   │   └── GalleryViewModel.swift  # Gallery logic
│   │   └── Settings/
│   │       ├── SettingsView.swift      # App preferences
│   │       └── APISettingsView.swift   # API configuration
│   ├── Models/
│   │   ├── Photo.swift                 # Core Data model
│   │   ├── AIModel.swift               # AI model definitions
│   │   └── EditingPreset.swift         # Predefined presets
│   ├── Services/
│   │   ├── CameraService.swift         # Camera operations
│   │   ├── ReplicateService.swift      # API integration
│   │   ├── PhotoStorageService.swift   # Photo persistence
│   │   └── NotificationService.swift   # Push notifications
│   ├── Extensions/
│   │   ├── Image+Processing.swift      # Image utilities
│   │   ├── Color+Theme.swift           # App theming
│   │   └── View+Extensions.swift       # SwiftUI helpers
│   └── Resources/
│       ├── Assets.xcassets             # Images, icons
│       ├── Info.plist                  # App configuration
│       └── TastyShot.xcdatamodeld     # Core Data model
└── Widgets/
    └── TastyShotWidget/                # iOS widget extension
```

## Native iOS Features

### 1. Camera Integration
- **AVCaptureSession**: Professional camera control
- **Features**:
  - Multiple lens support (Wide, Ultra Wide, Telephoto)
  - Focus and exposure control
  - Grid overlay and leveling
  - Timer functionality
  - Volume button capture
  - Force Touch camera controls
  - Live photo capture option

```swift
class CameraService: NSObject, ObservableObject {
    private let captureSession = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    
    func setupCamera() {
        captureSession.sessionPreset = .photo
        // Configure multiple camera inputs
        // Setup live preview layer
        // Configure photo output settings
    }
}
```

### 2. Photos Framework Integration
- **PHPhotoLibrary**: Seamless photo library access
- **Features**:
  - Save to Camera Roll with metadata
  - Import from photo library
  - HEIF/HEIC format support
  - Live Photos compatibility
  - Photo editing extensions

### 3. iOS System Integration
- **Share Sheet**: Native sharing to apps/services
- **Shortcuts**: Siri Shortcuts integration
- **Widgets**: Home screen quick access
- **Control Center**: Custom camera controls
- **Files App**: Export/import functionality
- **AirDrop**: Wireless photo sharing

## AI Model Integration

### Replicate API Service
```swift
class ReplicateService: ObservableObject {
    private let apiToken = ProcessInfo.processInfo.environment["REPLICATE_API_TOKEN"]
    private let baseURL = "https://api.replicate.com/v1"
    
    // Supported Models (same as PWA)
    enum AIModel: String, CaseIterable {
        case seedEdit = "bytedance/seededit-3.0"
        case fluxKontextMax = "black-forest-labs/flux-kontext-max"
        case fluxKreaDev = "black-forest-labs/flux-krea-dev"
        case fluxKontextPro = "black-forest-labs/flux-kontext-pro"
        case qwenImageEdit = "qwen/qwen-image-edit"
    }
    
    func enhancePhoto(_ image: UIImage, with model: AIModel) async throws -> UIImage {
        // Convert UIImage to base64
        // Call Replicate API
        // Handle async response
        // Return enhanced UIImage
    }
}
```

## Core Features

### 1. Native Camera Interface
```swift
struct CameraView: View {
    @StateObject private var cameraService = CameraService()
    
    var body: some View {
        ZStack {
            CameraPreviewView(session: cameraService.session)
            
            VStack {
                Spacer()
                
                HStack {
                    // Flash control
                    Button(action: toggleFlash) {
                        Image(systemName: flashMode.iconName)
                    }
                    
                    Spacer()
                    
                    // Capture button
                    Button(action: capturePhoto) {
                        Circle()
                            .stroke(Color.white, lineWidth: 4)
                            .frame(width: 70, height: 70)
                    }
                    
                    Spacer()
                    
                    // Camera flip
                    Button(action: flipCamera) {
                        Image(systemName: "camera.rotate")
                    }
                }
                .padding()
            }
        }
    }
}
```

### 2. AI-Enhanced Photo Editing
```swift
struct PhotoEditorView: View {
    let originalPhoto: UIImage
    @State private var enhancedPhoto: UIImage?
    @State private var selectedModel: ReplicateService.AIModel = .seedEdit
    @State private var isProcessing = false
    
    var body: some View {
        VStack {
            // Photo comparison view
            PhotoComparisonView(
                original: originalPhoto,
                enhanced: enhancedPhoto
            )
            
            // Model selection picker
            Picker("AI Model", selection: $selectedModel) {
                ForEach(ReplicateService.AIModel.allCases, id: \.self) { model in
                    Text(model.displayName).tag(model)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            
            // Enhancement presets
            ScrollView(.horizontal) {
                LazyHStack {
                    ForEach(EditingPreset.allCases) { preset in
                        PresetButton(preset: preset) {
                            applyPreset(preset)
                        }
                    }
                }
            }
            
            // Process button
            Button("Enhance Photo") {
                Task {
                    await enhancePhoto()
                }
            }
            .disabled(isProcessing)
        }
    }
}
```

### 3. Photo Gallery with iCloud Sync
```swift
struct PhotoGalleryView: View {
    @Environment(\.managedObjectContext) private var context
    @FetchRequest(sortDescriptors: [NSSortDescriptor(keyPath: \Photo.createdAt, ascending: false)])
    private var photos: FetchedResults<Photo>
    
    var body: some View {
        LazyVGrid(columns: columns) {
            ForEach(photos) { photo in
                NavigationLink(destination: PhotoDetailView(photo: photo)) {
                    AsyncImage(url: photo.thumbnailURL) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.3))
                    }
                    .frame(width: 120, height: 120)
                    .clipped()
                    .cornerRadius(8)
                }
            }
        }
        .padding()
    }
}
```

## Data Persistence

### Core Data Stack
```swift
// Photo.swift - Core Data Model
@objc(Photo)
public class Photo: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var originalImageData: Data
    @NSManaged public var enhancedImageData: Data?
    @NSManaged public var createdAt: Date
    @NSManaged public var modelUsed: String?
    @NSManaged public var processingSettings: Data? // JSON encoded settings
    @NSManaged public var iCloudSynced: Bool
}
```

### iCloud Sync Configuration
```swift
lazy var persistentContainer: NSPersistentCloudKitContainer = {
    let container = NSPersistentCloudKitContainer(name: "TastyShot")
    
    // Configure for iCloud sync
    let storeDescription = container.persistentStoreDescriptions.first
    storeDescription?.setOption(true as NSNumber, 
                               forKey: NSPersistentHistoryTrackingKey)
    storeDescription?.setOption(true as NSNumber, 
                               forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
    
    return container
}()
```

## iOS-Specific Optimizations

### 1. Background Processing
```swift
class BackgroundTaskService {
    func schedulePhotoProcessing() {
        let request = BGProcessingTaskRequest(identifier: "com.tastyshot.photo-processing")
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        
        try? BGTaskScheduler.shared.submit(request)
    }
}
```

### 2. Widgets and Extensions
```swift
// iOS 17+ Interactive Widgets
struct TastyShotWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: "TastyShotWidget",
            intent: CapturePhotoIntent.self,
            provider: PhotoProvider()
        ) { entry in
            TastyShotWidgetView(entry: entry)
        }
        .configurationDisplayName("Quick Capture")
        .description("Quickly capture and enhance food photos")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}
```

### 3. Siri Shortcuts
```swift
// Intent definition for Siri Shortcuts
class CapturePhotoIntent: INIntent {
    @objc dynamic var modelType: String?
    @objc dynamic var useTimer: Bool = false
}

// Shortcuts donation
func donateShortcut() {
    let intent = CapturePhotoIntent()
    intent.modelType = "SeedEdit 3.0"
    
    let interaction = INInteraction(intent: intent, response: nil)
    interaction.donate { error in
        // Handle donation result
    }
}
```

## App Store Requirements

### Info.plist Configuration
```xml
<key>NSCameraUsageDescription</key>
<string>TastyShot needs camera access to capture food photos for AI enhancement</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Access your photo library to select and save enhanced photos</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Save your enhanced food photos to the photo library</string>

<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.tastyshot.photo-processing</string>
</array>
```

### App Store Connect Configuration
- **Categories**: Photography, Food & Drink
- **Age Rating**: 4+ (No objectionable content)
- **In-App Purchases**: Premium model access, processing credits
- **Privacy Labels**: Camera, Photos, Internet access
- **App Review Notes**: API key configuration instructions

## Monetization Strategy

### Freemium Model
- **Free Tier**: 
  - Basic SeedEdit 3.0 processing
  - 10 enhancements per month
  - Standard resolution output
- **Premium Tier** ($4.99/month):
  - All AI models available
  - Unlimited enhancements
  - 4K resolution output
  - Batch processing
  - Priority processing queue

### In-App Purchases
```swift
enum IAPProduct: String, CaseIterable {
    case premiumMonthly = "com.tastyshot.premium.monthly"
    case premiumYearly = "com.tastyshot.premium.yearly"
    case creditsPack10 = "com.tastyshot.credits.10"
    case creditsPack50 = "com.tastyshot.credits.50"
}
```

## Testing Strategy

### Unit Tests
- Camera service functionality
- Image processing utilities
- API service integration
- Core Data operations

### UI Tests
- Camera capture flow
- Photo editing workflow
- Gallery navigation
- Settings configuration

### Performance Tests
- Image processing memory usage
- API response handling
- Core Data query performance
- Widget update efficiency

## Deployment & Distribution

### TestFlight Beta
1. Internal testing with development team
2. External beta with photography enthusiasts
3. Collect feedback and metrics
4. Iterate based on user feedback

### App Store Release
```bash
# Build for release
xcodebuild -scheme "TastyShot" -configuration Release -archivePath TastyShot.xcarchive archive

# Export for App Store
xcodebuild -exportArchive -archivePath TastyShot.xcarchive -exportPath . -exportOptionsPlist ExportOptions.plist
```

## Security & Privacy

### Data Protection
- Keychain storage for API tokens
- CloudKit encryption for synced data
- Local photo encryption using Data Protection API
- Network security with certificate pinning

### Privacy Compliance
- iOS App Tracking Transparency compliance
- Minimal data collection policy
- User consent for analytics
- GDPR/CCPA compliance for international users

## Future iOS Features

### iOS 18+ Integration
- **Apple Intelligence**: On-device photo analysis
- **Control Center Integration**: Custom camera controls
- **Live Activities**: Real-time processing status
- **Interactive Widgets**: Direct capture from home screen

### visionOS Compatibility
- Spatial photo capture and editing
- Immersive gallery experience
- Hand tracking for photo manipulation
- Integration with Apple Vision Pro cameras

---

*This specification provides complete technical documentation for building TastyShot as a native iOS application with full platform integration while maintaining the same AI enhancement capabilities as the PWA version.*