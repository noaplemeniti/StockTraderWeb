document.addEventListener("DOMContentLoaded", () => {
    const changeEmailButton = document.getElementById("change-email-button");
    const changeUsernameButton = document.getElementById("change-username-button");
    const changePasswordButton = document.getElementById("change-password-button");
    const deleteAccountButton = document.getElementById("delete-account-button");

    const darkThemeButton = document.getElementById("dark-theme-button");
    const lightThemeButton = document.getElementById("light-theme-button");

    const closeUsernameModalButton = document.getElementById("close-username-modal");
    const closeEmailModalButton = document.getElementById("close-email-modal");
    const closePasswordModalButton = document.getElementById("close-password-modal");
    const closeDeleteAccountModalButton = document.getElementById("close-delete-account-modal");

    const submitUsernameChange = document.getElementById("submit-username-change");
    const submitPasswordChange = document.getElementById("submit-password-change");
    const submitEmailChange = document.getElementById("submit-email-change");
    const submitDeleteAccount = document.getElementById("confirm-delete-account");

    const newUsernameInput = document.getElementById("new-username-input");
    const confirmNewPasswordInput = document.getElementById("confirm-new-password-input");
    const newPasswordInput = document.getElementById("new-password-input");
    const currentPasswordInput = document.getElementById("current-password-input");
    const newEmailInput = document.getElementById("new-email-input");

    const emailError = document.getElementById("email-error");
    const usernameError = document.getElementById("username-error");
    const passwordError = document.getElementById("password-error");
    const deleteError = document.getElementById("delete-error");

    darkThemeButton?.addEventListener("click", () => loadTheme("dark"));
    lightThemeButton?.addEventListener("click", () => loadTheme("light"));

    function openEmailModal(){
        const modal = document.getElementById("email-modal");
        modal.classList.remove("hidden");
    }

    function closeEmailModal(){
        const modal = document.getElementById("email-modal");
        modal.classList.add("hidden");
    }

    function openUsernameModal(){
        const modal = document.getElementById("username-modal");
        modal.classList.remove("hidden");
    }

    function closeUsernameModal(){
        const modal = document.getElementById("username-modal");
        modal.classList.add("hidden");
    }

    function openPasswordModal(){
        const modal = document.getElementById("password-modal");
        modal.classList.remove("hidden");
    }

    function closePasswordModal(){
        const modal = document.getElementById("password-modal");
        modal.classList.add("hidden");
    }

    function openDeleteModal(){
        const modal = document.getElementById("delete-account-modal");
        modal.classList.remove("hidden");
    }

    function closeDeleteModal(){
        const modal = document.getElementById("delete-account-modal");
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
