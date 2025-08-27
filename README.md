# 🍽️ TastyShot

**Transform your food photos with AI-powered enhancement**

A professional PWA photo editor designed specifically for food photography. Capture, edit, and enhance your culinary creations with advanced AI models and refined food-specific editing presets.

## ✨ Key Features

- **📸 Instant Camera Access**: Take photos directly in the app with iOS-optimized camera interface
- **🎨 AI-Powered Food Enhancement**: 8 specialized food photography presets organized by style and lighting
- **📝 Prompt Preview Editor**: Edit and customize AI prompts before applying
- **🔄 Before/After Comparison**: Interactive slider to compare original vs enhanced photos
- **📱 Progressive Web App**: Install on any device, works offline
- **📚 Photo History**: Keep track of your edited photos locally
- **⚡ Real-time Processing**: Powered by Google Gemini 2.5 Flash Image Preview

## 🍴 Food Photography Presets

### Food Styles 🍽️
- **Overhead Flat Lay**: Top-down composition with styled table setup
- **Texture Close-Up**: Macro detail shots highlighting food textures
- **Delivery Ready**: Professional food container presentation
- **Fine Dining**: Elegant plating on premium dinnerware

### Lighting & Mood 💡
- **Dramatic Restaurant**: Warm ambiance with strategic shadows
- **Soft Studio Light**: High-key lighting with minimal shadows
- **Studio Quality**: Professional DSLR-style photography
- **Natural Daylight**: Bright, fresh daylight enhancement

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Google Gemini API key
- HTTPS environment (required for camera access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nerveband/tastyshot.git
   cd tastyshot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔑 API Setup

### Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Get your Gemini API key
3. Add both `GEMINI_API_KEY` and `VITE_GEMINI_API_KEY` to your environment variables

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI Processing**: Google Gemini 2.5 Flash Image Preview
- **Styling**: Tailwind CSS with custom design system
- **PWA**: Vite PWA Plugin + Workbox
- **Deployment**: Vercel with serverless functions
- **Camera**: getUserMedia API with mobile optimizations

## 📱 Mobile Optimization

- **Responsive Design**: Mobile-first approach with viewport-fitted layouts
- **Keyboard Handling**: Smart keyboard detection and UI adjustments
- **Touch Gestures**: Native-feeling interactions
- **PWA Installation**: Add to home screen for app-like experience
- **Offline Support**: Service worker caching for offline functionality

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run deploy
```

### Manual Deployment
1. Build: `npm run build`
2. Deploy the `dist/` folder
3. Configure environment variables on your platform
4. Ensure HTTPS is enabled

## 🔧 Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run lint       # Run ESLint
npm run preview    # Preview production build
npm run deploy     # Build and deploy to Vercel
```

## 🎨 Design Philosophy

TastyShot features a **Leica-inspired aesthetic** with:
- Deep black backgrounds (#000000)
- Subtle white text (#F5F5F5) 
- Red-orange gradient accents
- Clean typography with wide letter spacing
- Professional camera interface design

## 🐛 Troubleshooting

### Camera Access Issues
- Ensure you're using HTTPS
- Check browser permissions for camera access
- Try refreshing the page
- Clear browser cache and reload

### API Issues
- Verify your Gemini API key is correctly set
- Check API quota and billing status
- Monitor network requests in browser dev tools

### PWA Issues
- Clear service worker cache
- Reinstall PWA from browser menu
- Check network connectivity for initial load

## 📞 Contact & Support

- **Email**: [hello@ashrafali.net](mailto:hello@ashrafali.net)
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Creator**: [Ashraf Ali](https://ashrafali.net)

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Made by [Ashraf](https://ashrafali.net) ❤️**