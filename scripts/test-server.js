// Script para testar se o servidor está funcionando
const http = require('http');

function testServer() {
  console.log('🧪 Testando servidor...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Servidor respondendo! Status: ${res.statusCode}`);
    console.log(`📊 Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    if (res.statusCode === 200) {
      console.log('🎉 Servidor funcionando perfeitamente!');
      console.log('🌐 Acesse: http://localhost:3000');
    } else {
      console.log('⚠️ Servidor respondendo, mas com status inesperado');
    }
  });

  req.on('error', (err) => {
    console.error('❌ Erro ao conectar com o servidor:', err.message);
    console.log('💡 Verifique se o servidor está rodando com: npm run dev');
  });

  req.on('timeout', () => {
    console.error('⏰ Timeout ao conectar com o servidor');
    req.destroy();
  });

  req.end();
}

testServer(); 