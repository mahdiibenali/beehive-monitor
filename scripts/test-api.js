async function test() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "apiculteur@nahoul.tn", password: "password123" })
  });
  
  if (!loginRes.ok) {
    console.log("Login failed");
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log("Login genre:", loginData.user.genre);
  
  // Set genre
  const patchRes = await fetch("http://localhost:3000/api/auth/profile", {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": "nectalous_session=" + token
    },
    body: JSON.stringify({ genre: "Homme test" })
  });
  const patchData = await patchRes.json();
  console.log("Patch genre:", patchData.user?.genre);

  // Get profile
  const meRes = await fetch("http://localhost:3000/api/auth/me", {
    headers: { "Cookie": "nectalous_session=" + token }
  });
  const meData = await meRes.json();
  console.log("Me genre:", meData.user?.genre);
}
test().catch(console.error);
