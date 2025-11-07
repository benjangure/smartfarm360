# SmartFarm360 Images Directory

## 📁 How to Add Your Custom Images

### **1. Add Your Farm Background Image**
- Place your farming background image in this directory
- Recommended name: `farm-background.jpg` or `farm-background.png`
- Recommended size: 1920x1080 or higher for best quality
- The image will be used in both login and registration pages

### **2. Supported Image Formats**
- JPG/JPEG (recommended for photos)
- PNG (recommended for logos with transparency)
- WebP (for optimized loading)

### **3. Image Usage in Components**

#### **Login & Registration Background**
```html
<img src="assets/images/farm-background.jpg" alt="Farm Background">
```

#### **Logo/Brand Images**
```html
<img src="assets/images/logo.png" alt="SmartFarm360 Logo">
```

### **4. Recommended Images to Add**
- `farm-background.jpg` - Main background for login/register pages
- `logo.png` - Company/app logo (optional)
- `farm-landscape.jpg` - Additional farming scenes
- `tractor.jpg` - Equipment images
- `crops.jpg` - Crop/harvest images

### **5. Image Optimization Tips**
- Compress images before adding (use tools like TinyPNG)
- Use WebP format for better performance
- Keep file sizes under 2MB for web performance
- Use descriptive filenames

### **6. Current Image References**
The system currently references:
- `assets/images/farm-background.jpg` (login/register background)
- Falls back to Unsplash image if custom image not found

### **7. How to Replace Images**
1. Add your image file to this directory
2. Update the `src` attribute in the component HTML files
3. The system will automatically use your custom images

**Example:**
```html
<!-- Before -->
<img src="https://images.unsplash.com/photo-..." alt="Farm">

<!-- After -->
<img src="assets/images/your-custom-farm.jpg" alt="Farm">
```