(function () {
  function initNavbarScroll() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;

    var shell = nav.closest('.top-shell');
    if (!shell) return;

    var isScrolled = false;

    function setNavbarHeight() {
      shell.style.setProperty('--navbar-height', nav.offsetHeight + 'px');
    }

    function fixNavbar() {
      if (isScrolled) return;

      var offset = Math.max(nav.getBoundingClientRect().top, 0);
      setNavbarHeight();
      nav.style.transform = 'translateY(' + offset + 'px)';
      nav.classList.add('scrolled');
      shell.classList.add('navbar-is-scrolled');
      isScrolled = true;

      nav.offsetHeight;
      requestAnimationFrame(function () {
        nav.style.transform = '';
      });
    }

    function unfixNavbar() {
      if (!isScrolled) return;

      nav.classList.remove('scrolled');
      shell.classList.remove('navbar-is-scrolled');
      nav.style.transform = '';
      isScrolled = false;
    }

    function updateNavbar() {
      if (window.scrollY > nav.offsetHeight + 55) {
        fixNavbar();
      } else {
        unfixNavbar();
      }
    }

    setNavbarHeight();
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });
    window.addEventListener('resize', function () {
      unfixNavbar();
      setNavbarHeight();
      updateNavbar();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarScroll);
  } else {
    initNavbarScroll();
  }
})();
