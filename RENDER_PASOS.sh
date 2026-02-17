#!/bin/bash

# 📋 PASOS PARA EJECUTAR EN RENDER

echo "🚀 GUÍA: Cómo ejecutar el proyecto en Render"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣  PREPARAR GITHUB"
echo "   git add ."
echo "   git commit -m 'Add Render configuration'"
echo "   git push origin main"
echo ""

echo "2️⃣  EN GITHUB"
echo "   ✓ Verifica que .env NO esté en los archivos"
echo "   ✓ Verifica que render.yaml SÍ esté en los archivos"
echo ""

echo "3️⃣  VAMOS A RENDER (render.com)"
echo "   A. Inicia sesión / Regístrate"
echo "   B. Click 'New +' → 'Web Service'"
echo "   C. Select Repository → Generador_Datos_FK"
echo "   D. Deploy settings:"
echo "      - Name: baseDR-seeding"
echo "      - Root Directory: /"
echo "      - Runtime: Node"
echo "      - Build Command: npm install"
echo "      - Start Command: node src/seed_all.js"
echo ""

echo "4️⃣  AGREGAR VARIABLE MONGO_URI EN RENDER"
echo "   A. Clic en 'Environment'"
echo "   B. Clic 'Add Environment Variable'"
echo "   C. Key: MONGO_URI"
echo "   D. Value: mongodb+srv://derikerdenoter_db_user:nMA2aXGjEub7XnTC@cluster0.vslshhd.mongodb.net/?appName=Cluster0"
echo "   E. Clic 'Save'"
echo ""

echo "5️⃣  DEPLOY"
echo "   Clic 'Deploy Web Service'"
echo ""

echo "6️⃣  VER LOGS"
echo "   Logs → verás el progreso de generación"
echo "   Esperado: 3-5 minutos"
echo ""

echo "7️⃣  RESULTADO"
echo "   ✅ 200k clientes"
echo "   ✅ 200k productos"
echo "   ✅ ~2M variaciones"
echo "   En tu MongoDB Atlas"
echo ""

echo "════════════════════════════════════════════════════════════"
echo ""
echo "⏱️  PARA EJECUTAR DE NUEVO (próxima prueba):"
echo "   - Opción A: Haz commit y push → Render redeploy automático"
echo "   - Opción B: En Render dashboard → Manual Deploy"
echo ""
echo "════════════════════════════════════════════════════════════"
