(async ()=>{
  const ports = [3000, 3001];
  const payloads = [
    { inviteCode: 'TESTu93gdg' },
    { inviteCode: 'TESTU93GDG' },
    { email: 'Vameh09@gmail.com' }
  ];

  for (const port of ports) {
    for (const body of payloads) {
      const url = `http://localhost:${port}/api/invite/validate`;
      console.log('POST', url, JSON.stringify(body));
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const text = await res.text();
        console.log('=>', port, res.status, text.slice(0, 1000));
      } catch (e) {
        console.error('ERR', port, e.message);
      }
    }
  }
})();
