
// EA KIET COFFEE - MAIN JAVASCRIPT

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

// Mở và đóng menu trên điện thoại
menuToggle.addEventListener("click", function () {
    const isOpen = navigation.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.textContent = isOpen ? "✕" : "☰";
});

// Đóng menu khi người dùng chọn một mục
document.querySelectorAll(".navigation a").forEach(function (link) {
    link.addEventListener("click", function () {
        navigation.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
    });
});

console.log("EA KIET Coffee website is running!");
