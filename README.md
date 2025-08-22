# 🍽️ TASTY SHOT

A professional PWA photo editor powered by AI, designed with a Leica-inspired aesthetic. Capture, edit, and enhance photos instantly with cutting-edge AI models.

## ✨ Features

### 📸 **Camera Interface**
- Instant camera access with iOS optimization
- Professional viewfinder with rule-of-thirds grid
- Front/back camera switching
- Leica-inspired UI design with dark theme

### 🎨 **AI-Powered Editing**
- **Qwen Image Edit Model**: Advanced AI image editing
- **6 Preset Styles**: Enhance, Dramatic, Vintage, B&W, Pro Edit, Artistic
- **Custom Prompts**: Describe your vision in natural language
- **Real-time Streaming**: Live progress updates during processing
- **Image Upscaling**: 2x and 4x enhancement options

### 🔄 **Before/After Comparison**
- Interactive slider to compare original vs edited
- Smooth transition animation
- Professional comparison interface

### 📱 **PWA Features**
- **Offline Ready**: Works without internet connection
- **Install Prompt**: Add to home screen like a native app
- **iOS Optimized**: Perfect mobile experience on Safari
- **HTTPS Required**: Secure camera access

### 🗂️ **Photo History**
- Local storage of edited photos
- Re-edit previous photos with new prompts
- Download and share functionality
- Delete unwanted edits

## 🚀 **Tech Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Leica design system
- **PWA**: Vite PWA Plugin + Workbox
- **AI**: Replicate API (Qwen Image Edit + Google Upscaler)
- **Camera**: getUserMedia API with iOS optimizations
- **Storage**: localStorage (IndexedDB ready for Phase 2)

## 🛠️ **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tastyshot.git
   cd tastyshot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   VITE_REPLICATE_API_TOKEN=your_replicate_api_token
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 **API Keys Setup**

### Replicate API
1. Sign up at [Replicate](https://replicate.com)
2. Get your API token from the dashboard
3. Add to `.env` as `VITE_REPLICATE_API_TOKEN`

### Supabase (Phase 2 - Credit System)
1. Create project at [Supabase](https://supabase.com)
2. Get URL and anon key from settings
3. Add to `.env` as shown above

## 📱 **iOS Setup**

For optimal iOS experience:

1. **HTTPS Required**: Camera access requires HTTPS
2. **Add to Home Screen**: Install as PWA for best performance
3. **Safari Compatibility**: Optimized for iOS Safari
4. **Touch Gestures**: Native-feeling touch interactions

## 🎨 **Design System**

### Colors
- **Background**: Deep Black (#000000)
- **Text**: Subtle White (#F5F5F5)
- **Accents**: Red-Orange-Yellow Gradient
- **Theme**: Professional camera aesthetic

### Typography
- **Font**: Clean sans-serif (Arial, Helvetica)
- **Style**: All caps, wide tracking
- **Weight**: Bold for emphasis

## 🔮 **Phase 2: Credit System**

The app is architected to easily add:

### Authentication
- Supabase Auth integration
- User registration/login
- Profile management

### Credit System
- PostgreSQL database schema ready
- Transaction tracking
- Usage analytics
- Subscription management

### Database Schema
```sql
-- Users (managed by Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  credits INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Photo editing history
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  original_url TEXT NOT NULL,
  edited_url TEXT,
  prompt TEXT NOT NULL,
  cost INTEGER DEFAULT 1,
  status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  type VARCHAR NOT NULL, -- 'purchase', 'usage', 'refund'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Deployment**

### Vercel (Recommended)
```bash
npm run deploy
```

### Manual Deployment
1. Build the app: `npm run build`
2. Deploy `dist/` folder to your hosting provider
3. Configure environment variables on hosting platform
4. Enable HTTPS for camera access

## 🔒 **Security**

- **HTTPS Enforced**: Required for camera access
- **Environment Variables**: API keys properly secured
- **CSP Headers**: Content Security Policy ready
- **No Inline Scripts**: Secure PWA configuration

## 🐛 **Troubleshooting**

### Camera Issues
- Ensure HTTPS is enabled
- Check browser permissions
- Try refreshing the page
- Clear browser cache

### PWA Issues
- Clear service worker cache
- Reinstall PWA from browser
- Check network connectivity

### API Issues
- Verify API keys in environment variables
- Check Replicate account quota
- Monitor network requests in dev tools

## 📄 **License**

MIT License - See LICENSE file for details

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 **Support**

For issues and feature requests, please use GitHub Issues or contact support.

---

**Built with ❤️ using modern web technologies**