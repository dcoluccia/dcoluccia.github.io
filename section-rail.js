(function () {
  function initSectionRail() {
    var rail = document.querySelector('.section-rail');
    if (!rail) return;

    var links = Array.prototype.slice.call(rail.querySelectorAll('[data-section-target]'));
    var sections = links
      .map(function (link) {
        return {
          link: link,
          section: document.getElementById(link.getAttribute('data-section-target'))
        };
      })
      .filter(function (item) {
        return item.section;
      });

    if (!sections.length) return;
    var clickedItem = null;

    function setActive(activeItem) {
      sections.forEach(function (item) {
        item.link.classList.toggle('is-active', item === activeItem);
        if (item === activeItem) {
          item.link.setAttribute('aria-current', 'true');
        } else {
          item.link.removeAttribute('aria-current');
        }
      });
    }

    function updateRailPosition() {
      var firstSection = sections[0].section.getBoundingClientRect();
      var railHalfHeight = rail.offsetHeight / 2;
      var visibleTop = Math.max(firstSection.top, 0);
      var visibleBottom = Math.min(firstSection.bottom, window.innerHeight);
      var visibleHeight = Math.max(0, visibleBottom - visibleTop);
      var targetTop = visibleHeight > 0
        ? visibleTop + visibleHeight / 2
        : firstSection.top + firstSection.height / 2;
      var minTop = railHalfHeight + 16;
      var maxTop = window.innerHeight - railHalfHeight - 16;
      var clampedTop = Math.min(Math.max(targetTop, minTop), maxTop);

      rail.style.setProperty('--section-rail-top', clampedTop + 'px');
    }

    function updateActiveSection() {
      var documentHeight = document.documentElement.scrollHeight;
      var scrollBottom = window.scrollY + window.innerHeight;
      var isAtBottom = scrollBottom >= documentHeight - 2;
      var activeItem = sections[0];
      var marker = window.scrollY + window.innerHeight * 0.55;

      if (clickedItem) {
        setActive(clickedItem);
        return;
      }

      if (isAtBottom) {
        setActive(sections[sections.length - 1]);
        return;
      }

      sections.forEach(function (item) {
        if (item.section.offsetTop <= marker) {
          activeItem = item;
        }
      });

      setActive(activeItem);
    }

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        var target = document.getElementById(link.getAttribute('data-section-target'));
        if (!target) return;
        clickedItem = sections.find(function (item) {
          return item.section === target;
        });
        setActive(clickedItem);
      });
    });

    function clearClickedItem() {
      if (!clickedItem) return;
      clickedItem = null;
      updateActiveSection();
    }

    updateRailPosition();
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', function () {
      updateRailPosition();
      updateActiveSection();
    });
    window.addEventListener('wheel', clearClickedItem, { passive: true });
    window.addEventListener('touchmove', clearClickedItem, { passive: true });
    window.addEventListener('keydown', clearClickedItem);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSectionRail);
  } else {
    initSectionRail();
  }
})();
