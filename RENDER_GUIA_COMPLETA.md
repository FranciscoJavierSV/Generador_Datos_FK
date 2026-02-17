# 🚀 GUÍA COMPLETA: EJECUTAR EN RENDER

## ✅ Cambios Realizados Localmente

- ✓ `.env` → Actualizado con MongoDB Atlas + SEED_N=200000
- ✓ `.gitignore` → Protege credenciales (`.env` no se sube)
- ✓ `render.yaml` → Configuración para Render
- ✓ `.env.example` → Actualizado para referencia

---

## 📋 PASOS EJECUTAR EN RENDER (Copia y Pega)

### **Paso 1: Preparar GitHub (Terminal)**

```bash
cd /home/javi/baseDR

# Verificar que todo está listo
git status

# Commitear cambios
git add .
git commit -m "Add Render config y MongoDB Atlas"
git push origin main
```

**Resultado esperado:**
```
main 1234567 Add Render config y MongoDB Atlas
```

---

### **Paso 2: Crear Proyecto en Render (Web)**

1. Ve a **https://render.com**
2. Inicia sesión / Regístrate (puedes usar GitHub)
3. Click **"New"** → **"Web Service"**
4. **"Connect a repository"**
   - Busca: `Generador_Datos_FK`
   - Click **"Connect"**

---

### **Paso 3: Configurar Web Service**

**En el formulario:**

```
Name: baseDR-seeding
Runtime: Node
Root Directory: / (leave empty)
Build Command: npm install
Start Command: node src/seed_all.js
Branch: main
```

**Plan:** Free (está bien)

---

### **Paso 4: Agregar Variables de Entorno**

Antes de dar Deploy, click **"Advanced"** y agrega:

```
MONGO_URI = mongodb+srv://derikerdenoter_db_user:nMA2aXGjEub7XnTC@cluster0.vslshhd.mongodb.net/?appName=Cluster0
SEED_N = 200000
SEED_BATCH = 10000
SEED_WORKERS = 4
```

---

### **Paso 5: Deploy**

Click **"Create Web Service"**

**Render:**
- ✅ Clona tu repo
- ✅ Instala dependencias
- ✅ Ejecuta `seed_all.js`
- ✅ Se conecta a MongoDB Atlas
- ✅ Genera 200k clientes + 200k productos

**Tiempo:** 3-5 minutos

---

## 📊 Ver Progreso

1. En Render dashboard del proyecto
2. Tab **"Logs"**
3. Verás:
   ```
   📌 Seeding Clientes: 200000 registros con 4 workers
   [Clientes] Insertados 50000/200000
   [Clientes] Insertados 100000/200000
   ... (así cada 50k)
   ```

---

## ✅ Cuando Termine (5 minutos después)

Verás:
```
✅ Clientes completado en 45s
✅ Productos completado en 50s
✅ Variaciones completado en 120s
✅ 🎉 ¡Seeding completado con éxito!
```

---

## 🔄 Para Ejecutar de Nuevo (Próxima Prueba)

### **Opción A: Automático (Más fácil)**
```bash
# Haz un cambio en GitHub
echo "# Test" >> README.md
git add README.md
git commit -m "Trigger redeploy"
git push

# Render automáticamente redeploy y ejecuta
```

### **Opción B: Manual (Desde Render Dashboard)**
1. Ve al proyecto en Render
2. Click **"Manual Deploy"** → **"Clear build cache"** → **"Deploy"**

---

## 📝 Cambios Realizados en tu Proyecto

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `.env` | MongoDB Atlas + 200k | Conectar a BD en la nube |
| `.gitignore` | + `.env` | No subir credenciales |
| `render.yaml` | ✨ Nuevo | Configuración automática |
| `.env.example` | Actualizado | Referencia sin credenciales |

---

## ⚠️ Importante

```
❌ NO commits el .env a GitHub (ya está en .gitignore)
❌ NO compartas el link con la contraseña (solo para desarrollo)
✅ Las credenciales van en Render Environment Variables
✅ GitHub solo tiene .env.example (sin contraseña)
```

---

## 🎯 Resumen

```
TU COMPUTADORA (local)
    ↓
GITHUB (sin credenciales)
    ↓
RENDER (lee GitHub)
    ↓
Construye Docker
    ↓
Ejecuta seed_all.js
    ↓
MONGODB ATLAS (en la nube)
    ↓
✅ 200k clientes + 200k productos + variaciones
```

---

## 🚀 ¡Casi Listo!

Ejecuta esto y sigue los pasos:

```bash
cd /home/javi/baseDR
git add .
git commit -m "Add Render config"
git push origin main
```

Luego ve a **render.com** y sigue los pasos 2-5.

¡En 3-5 minutos tendrás los datos en la nube! 🎉
