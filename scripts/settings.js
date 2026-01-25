document.addEventListener("DOMContentLoaded", () => {
    const changeEmailButton = document.getElementById("changeEmailButton");
    const changeUsernameButton = document.getElementById("changeUsernameButton");
    const changePasswordButton = document.getElementById("changePasswordButton");
    const deleteAccountButton = document.getElementById("deleteAccountButton");

    const darkThemeButton = document.getElementById("darkThemeButton");
    const lightThemeButton = document.getElementById("lightThemeButton");
    const blueThemeButton = document.getElementById("blueThemeButton");
    const purpleThemeButton = document.getElementById("purpleThemeButton");

    const closeUsernameModalButton = document.getElementById("closeUsernameModal");
    const closeEmailModalButton = document.getElementById("closeEmailModal");
    const closePasswordModalButton = document.getElementById("closePasswordModal");
    const closeDeleteAccountModalButton = document.getElementById("closeDeleteAccountModal");

    const submitUsernameChange = document.getElementById("submitUsernameChange");
    const submitPasswordChange = document.getElementById("submitPasswordChange");
    const submitEmailChange = document.getElementById("submitEmailChange");
    const submitDeleteAccount = document.getElementById("confirmDeleteAccount");

    const newUsernameInput = document.getElementById("newUsernameInput");
    const confirmNewPasswordInput = document.getElementById("confirmNewPasswordInput");
    const newPasswordInput = document.getElementById("newPasswordInput");
    const currentPasswordInput = document.getElementById("currentPasswordInput");
    const newEmailInput = document.getElementById("newEmailInput");

    const emailError = document.getElementById("emailError");
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");
    const deleteError = document.getElementById("deleteError");

    darkThemeButton?.addEventListener("click", () => loadTheme("dark"));
    lightThemeButton?.addEventListener("click", () => loadTheme("light"));
    blueThemeButton?.addEventListener("click", () => loadTheme("blue"));
    purpleThemeButton?.addEventListener("click", () => loadTheme("purple"));

    function openEmailModal(){
        const modal = document.getElementById("emailModal");
        modal.classList.remove("hidden");
    }

    function closeEmailModal(){
        const modal = document.getElementById("emailModal");
        modal.classList.add("hidden");
    }

    function openUsernameModal(){
        const modal = document.getElementById("usernameModal");
        modal.classList.remove("hidden");
    }

    function closeUsernameModal(){
        const modal = document.getElementById("usernameModal");
        modal.classList.add("hidden");
    }

    function openPasswordModal(){
        const modal = document.getElementById("passwordModal");
        modal.classList.remove("hidden");
    }

    function closePasswordModal(){
        const modal = document.getElementById("passwordModal");
        modal.classList.add("hidden");
    }

    function openDeleteModal(){
        const modal = document.getElementById("deleteAccountModal");
        modal.classList.remove("hidden");
    }

    function closeDeleteModal(){
        const modal = document.getElementById("deleteAccountModal");
        modal.classList.add("hidden");
    }

    changeEmailButton.addEventListener("click", openEmailModal);
    closeEmailModalButton.addEventListener("click", closeEmailModal);
    changeUsernameButton.addEventListener("click", openUsernameModal);
    closeUsernameModalButton.addEventListener("click", closeUsernameModal);
    changePasswordButton.addEventListener("click", openPasswordModal);
    closePasswordModalButton.addEventListener("click", closePasswordModal);
    deleteAccountButton.addEventListener("click", openDeleteModal);
    closeDeleteAccountModalButton.addEventListener("click", closeDeleteModal);

    submitEmailChange.addEventListener("click", async () => {
        const newEmail = newEmailInput.value;
        try {
            const res = await fetch("/api/user/updateEmail", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newEmail: newEmail
                })
            });
            if(!res.ok){
                const data = await res.json();
                throw new Error(data.error);
            }
            closeEmailModal();
        } catch(err){
            emailError.classList.remove("hidden");
            emailError.textContent = err?.message || "Failed to change email.";
        }
    });

    submitUsernameChange.addEventListener("click", async () => {
        const newUsername = newUsernameInput.value;
        try {
            const res = await fetch("/api/user/updateUsername", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newUsername: newUsername
                })
            });
            if(!res.ok){
                const data = await res.json();
                throw new Error(data.error);
            }
            closeUsernameModal()
        } catch(err){
            usernameError.classList.remove("hidden");
            usernameError.textContent = err?.message || "Failed to change username.";
        }
    });

    submitPasswordChange.addEventListener("click", async () => {
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;
        const currentPassword = currentPasswordInput.value;

        try {
            const res = await fetch("/api/user/updatePassword",{
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmNewPassword: confirmNewPassword
                })
            });

            if(!res.ok){
                const data = res.json();
                throw new Error(data.error);
            }
            closePasswordModal()
        } catch(err){
            passwordError.classList.remove("hidden");
            passwordError.textContent = err?.message || "Failed to change password.";
        }
    });

    submitDeleteAccount?.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/user/deleteAccount", {
            method: "DELETE"
        });
        const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete account.");
            }
            closeDeleteModal();
            window.location.href = "/pages/register.html";
        } catch (err) {
            deleteError.classList.remove("hidden");
            deleteError.textContent = err?.message || "Failed to delete account.";
        }
    });
});