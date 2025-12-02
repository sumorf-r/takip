# 📤 GitHub'a Push Komutları

## Şu Komutları Sırayla Çalıştırın:

```bash
# 1. Git başlat (eğer başlamadıysa)
git init

# 2. Tüm dosyaları ekle
git add .

# 3. İlk commit
git commit -m "Initial commit - Restoran Personel Takip Sistemi v1.0"

# 4. Ana branch'i main yap
git branch -M main

# 5. GitHub repo'yu remote olarak ekle
git remote add origin https://github.com/jumbocarides/takip.git

# 6. Push!
git push -u origin main
```

## ⚠️ Eğer "remote origin already exists" hatası alırsanız:

```bash
git remote remove origin
git remote add origin https://github.com/jumbocarides/takip.git
git push -u origin main
```

## 🔐 GitHub Authentication

Eğer username/password soruyorsa:
- **Username**: jumbocarides
- **Password**: GitHub Personal Access Token (PAT) gerekir

### Personal Access Token Oluşturma:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Scope: `repo` seçin
4. Token'ı kopyalayın ve şifre olarak kullanın

---

**Push sonrası bir sonraki adıma geçeceğiz: Netlify'a bağlama!**
