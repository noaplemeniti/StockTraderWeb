document.getElemeentById("form-grid").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").ariaValueMax.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if(!username || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if(password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username, email, password})
    });
        const data = await res.json();
        if(!res.ok) {
            alert(data.error || "Registration failed.");
            return;
        }
        alert("Registration successful! You can now log in.");
        window.location.href = "/pages/login.html";
    } catch(err) {
        console.error("Registration error:", err);
        alert("An error occurred during registration.");
    }
});