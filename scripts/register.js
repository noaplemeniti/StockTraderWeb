document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username, email, password, confirmPassword})
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