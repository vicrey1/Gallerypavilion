const testInvite = async () => {
    try {
        const response = await fetch('http://localhost:3001/api/invite/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inviteCode: 'vameh09'
            })
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

testInvite();
