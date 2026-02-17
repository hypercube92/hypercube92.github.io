(function () {
  var path = window.location.pathname.replace(/\/$/, '') || '/';
  var locale = path.indexOf('/en') === 0 ? 'en' : 'fr';

  var nav = document.querySelector('[data-main-nav]');
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var navIsOpen = false;

  var navByLocale = {
    fr: [
      { href: '/fr/', label: 'Accueil' },
      { href: '/fr/menu/', label: 'Menus' },
      { href: '/fr/reserver/', label: 'Réserver' },
      { href: '/fr/privatisation/', label: 'Privatisation' },
      { href: '/fr/avis-clients/', label: 'Avis' },
      { href: '/fr/contact/', label: 'Contact' }
    ],
    en: [
      { href: '/en/', label: 'Home' },
      { href: '/en/menu/', label: 'Menus' },
      { href: '/en/book/', label: 'Book' },
      { href: '/en/private-events/', label: 'Private events' },
      { href: '/en/events/', label: 'Events' },
      { href: '/en/reviews/', label: 'Reviews' },
      { href: '/en/contact/', label: 'Contact' }
    ]
  };

  if (nav && navByLocale[locale]) {
    nav.innerHTML = navByLocale[locale]
      .map(function (item) {
        return '<a href="' + item.href + '">' + item.label + '</a>';
      })
      .join('');
  }

  if (menuToggle && nav) {
    var openMenuLabel = locale === 'fr' ? 'Ouvrir le menu' : 'Open menu';
    var closeMenuLabel = locale === 'fr' ? 'Fermer le menu' : 'Close menu';
    if (!nav.id) {
      nav.id = 'main-nav';
    }
    menuToggle.setAttribute('aria-controls', nav.id);

    function setMenuOpen(nextOpen) {
      navIsOpen = !!nextOpen;
      nav.classList.toggle('open', navIsOpen);
      menuToggle.setAttribute('aria-expanded', navIsOpen ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', navIsOpen ? closeMenuLabel : openMenuLabel);
      document.body.classList.toggle('menu-open', navIsOpen);
    }

    setMenuOpen(false);

    menuToggle.addEventListener('click', function () {
      setMenuOpen(!navIsOpen);
    });

    nav.addEventListener('click', function (event) {
      if (event.target === nav) {
        setMenuOpen(false);
        return;
      }
      if (!event.target || event.target.tagName !== 'A') {
        return;
      }
      if (window.matchMedia('(max-width: 820px)').matches) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('click', function (event) {
      if (!navIsOpen) {
        return;
      }
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 821px)').matches) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navIsOpen) {
        setMenuOpen(false);
      }
    });
  }

  var links = document.querySelectorAll('[data-main-nav] a');
  links.forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) {
      return;
    }
    var normalized = href.replace(/\/$/, '');
    var isLocaleRoot = normalized === '/fr' || normalized === '/en';
    if (normalized && (path === normalized || (!isLocaleRoot && path.indexOf(normalized) === 0))) {
      link.classList.add('active');
    }
  });

  var hero = document.querySelector('.hero');
  if (hero) {
    document.body.removeAttribute('data-hero-theme');
  }

  var mobileHeroCta = document.querySelector('[data-mobile-hero-cta]');
  var homeHero = document.querySelector('.lx-hero');
  if (mobileHeroCta && homeHero) {
    var mobileHeroQuery = window.matchMedia('(max-width: 820px)');
    var ctaTicking = false;

    function updateMobileHeroCtaVisibility() {
      var shouldShow = false;
      if (mobileHeroQuery.matches) {
        var rect = homeHero.getBoundingClientRect();
        shouldShow = rect.bottom <= 0;
      }
      mobileHeroCta.classList.toggle('is-visible', shouldShow);
      ctaTicking = false;
    }

    function requestMobileHeroCtaUpdate() {
      if (ctaTicking) {
        return;
      }
      ctaTicking = true;
      window.requestAnimationFrame(updateMobileHeroCtaVisibility);
    }

    requestMobileHeroCtaUpdate();
    window.addEventListener('load', requestMobileHeroCtaUpdate);
    window.addEventListener('scroll', requestMobileHeroCtaUpdate, { passive: true });
    window.addEventListener('resize', requestMobileHeroCtaUpdate);

    if (typeof mobileHeroQuery.addEventListener === 'function') {
      mobileHeroQuery.addEventListener('change', requestMobileHeroCtaUpdate);
    } else if (typeof mobileHeroQuery.addListener === 'function') {
      mobileHeroQuery.addListener(requestMobileHeroCtaUpdate);
    }
  }

  var revealNodes = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealNodes.length > 0) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  } else {
    revealNodes.forEach(function (node) {
      node.classList.add('is-visible');
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  var forms = document.querySelectorAll('[data-form]');
  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var message = form.querySelector('[data-form-message]');
      var required = form.querySelectorAll('[required]');
      var valid = true;

      required.forEach(function (field) {
        if (!field.value.trim()) {
          valid = false;
        }
      });

      if (!valid) {
        if (message) {
          message.className = 'form-message err';
          message.textContent = form.dataset.error || 'Merci de completer les champs obligatoires.';
        }
        return;
      }

      var emailField = form.querySelector('input[type="email"]');
      if (emailField && !/^\S+@\S+\.\S+$/.test(emailField.value)) {
        if (message) {
          message.className = 'form-message err';
          message.textContent = form.dataset.errorEmail || 'Adresse e-mail invalide.';
        }
        return;
      }

      if (message) {
        message.className = 'form-message ok';
        message.textContent = form.dataset.success || 'Merci, votre demande est bien envoyee.';
      }

      var reservationHint = form.querySelector('[data-reservation-hint]');
      if (reservationHint) {
        var timeField = form.querySelector('input[name="time"]');
        if (timeField && timeField.value) {
          var hour = Number(timeField.value.split(':')[0]);
          reservationHint.textContent =
            hour >= 22 || hour < 7
              ? 'Creneau tardif selectionne: votre table est maintenue 15 minutes apres l\'heure prevue.'
              : 'Creneau valide: votre table est maintenue 15 minutes apres l\'heure prevue.';
        }
      }

      var trackKey = form.dataset.track;
      if (trackKey) {
        console.log('[track]', trackKey, { path: window.location.pathname });
      }

      form.reset();
    });
  });

  var filterButtons = document.querySelectorAll('[data-filter]');
  var filterItems = document.querySelectorAll('[data-filter-item]');

  if (filterButtons.length > 0 && filterItems.length > 0) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        var wanted = btn.dataset.filter;
        filterItems.forEach(function (item) {
          if (wanted === 'all' || item.dataset.filterItem === wanted) {
            item.hidden = false;
          } else {
            item.hidden = true;
          }
        });
      });
    });
  }

  var reviewSlots = document.querySelectorAll('[data-google-reviews]');
  var summarySlots = document.querySelectorAll('[data-google-summary]');
  var googleWordmarkSrc = '/assets/images/google/google-logo.png';
  var googleGlyphSrc = '/assets/images/google/google-g.svg';

  function createGoogleBrand(isSmall) {
    var brand = document.createElement('span');
    brand.className = 'lx-google-brand' + (isSmall ? ' small' : '');

    var logo = document.createElement('img');
    logo.className = 'lx-google-logo';
    logo.loading = 'lazy';
    logo.decoding = 'async';
    logo.alt = isSmall ? '' : 'Google';
    if (isSmall) {
      logo.setAttribute('aria-hidden', 'true');
    }
    logo.src = isSmall ? googleGlyphSrc : googleWordmarkSrc;

    brand.appendChild(logo);
    return brand;
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function formatCount(n) {
    if (!Number.isFinite(n)) {
      return '0';
    }
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB').format(n);
  }

  function starsHtml(rating) {
    var full = Math.round(Math.max(0, Math.min(5, Number(rating || 0))));
    var empty = 5 - full;
    return '&#9733;'.repeat(full) + '&#9734;'.repeat(empty);
  }

  function createGoogleLinks(data) {
    var links = document.createElement('div');
    links.className = 'lx-google-links';

    if (data.mapsUri) {
      var maps = document.createElement('a');
      maps.href = data.mapsUri;
      maps.target = '_blank';
      maps.rel = 'noopener noreferrer';
      maps.className = 'lx-link';
      maps.textContent = locale === 'fr' ? 'Voir sur Google Maps' : 'Open on Google Maps';
      links.appendChild(maps);
    }

    if (data.newReviewUri) {
      var write = document.createElement('a');
      write.href = data.newReviewUri;
      write.target = '_blank';
      write.rel = 'noopener noreferrer';
      write.className = 'lx-link';
      write.textContent = locale === 'fr' ? 'Donner votre avis' : 'Write a review';
      links.appendChild(write);
    }

    return links.children.length > 0 ? links : null;
  }

  function renderSummary(slot, data) {
    slot.innerHTML = '';

    var wrapper = document.createElement('div');
    wrapper.className = 'lx-google-summary-card';

    var left = document.createElement('div');
    left.className = 'lx-google-left';

    var brandWrap = document.createElement('div');
    brandWrap.className = 'lx-google-brand-wrap';
    brandWrap.appendChild(createGoogleBrand(false));

    var provider = document.createElement('p');
    provider.className = 'lx-google-provider';
    provider.textContent = locale === 'fr' ? 'Google Reviews' : 'Google Reviews';
    brandWrap.appendChild(provider);

    left.appendChild(brandWrap);

    var right = document.createElement('div');
    right.className = 'lx-google-right';

    var score = document.createElement('p');
    score.className = 'lx-google-score';
    var avg = typeof data.average_rating === 'number' ? data.average_rating.toFixed(1) : '4.0';
    score.textContent = avg + ' / 5';

    var meta = document.createElement('p');
    meta.className = 'lx-google-meta';
    var total = formatCount(Number(data.total_review_count || 0));
    meta.textContent = total + (locale === 'fr' ? ' avis Google' : ' Google reviews');

    var stars = document.createElement('p');
    stars.className = 'lx-google-stars';
    stars.innerHTML = starsHtml(Number(avg));

    right.appendChild(score);
    right.appendChild(stars);
    right.appendChild(meta);

    wrapper.appendChild(left);
    wrapper.appendChild(right);

    slot.appendChild(wrapper);
  }

  function renderReviews(slot, data) {
    slot.innerHTML = '';

    var list = document.createElement('div');
    list.className = 'lx-google-reviews-grid';

    var all = Array.isArray(data.reviews) ? data.reviews : [];
    var limit = Number(slot.dataset.limit || all.length || 0);
    var entries = all.slice(0, limit > 0 ? limit : all.length);

    entries.forEach(function (review) {
      var card = document.createElement('article');
      card.className = 'lx-google-review-card reveal is-visible';

      var top = document.createElement('div');
      top.className = 'lx-google-review-top';

      var avatar = document.createElement('img');
      avatar.className = 'lx-google-avatar';
      avatar.loading = 'lazy';
      avatar.alt = review.name || 'Profil';
      avatar.src = review.profile_photo || '/assets/images/general/optimized/logo.svg';

      var person = document.createElement('div');
      person.className = 'lx-google-person';

      var name = document.createElement('p');
      name.className = 'lx-google-name';
      name.textContent = review.name || 'Client';

      var date = document.createElement('p');
      date.className = 'lx-google-date';
      date.textContent = formatDate(review.provider_created);

      person.appendChild(name);
      if (date.textContent) {
        person.appendChild(date);
      }

      var mark = createGoogleBrand(true);

      top.appendChild(avatar);
      top.appendChild(person);
      top.appendChild(mark);

      var stars = document.createElement('p');
      stars.className = 'lx-google-stars';
      var rating = Math.max(0, Math.min(5, Number(review.rating || 0)));
      stars.innerHTML = starsHtml(rating);

      var text = document.createElement('p');
      text.className = 'lx-google-text';
      text.textContent = review.text || '';

      card.appendChild(top);
      card.appendChild(stars);
      card.appendChild(text);

      list.appendChild(card);
    });

    slot.appendChild(list);

    var links = createGoogleLinks(data);
    if (links) {
      slot.appendChild(links);
    }
  }

  if (reviewSlots.length > 0 || summarySlots.length > 0) {
    var source = '/assets/google-reviews-fr.json';
    var refNode = reviewSlots[0] || summarySlots[0];
    if (refNode && refNode.dataset.googleSource) {
      source = refNode.dataset.googleSource;
    }

    fetch(source)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('google reviews fetch failed');
        }
        return res.json();
      })
      .then(function (data) {
        summarySlots.forEach(function (slot) {
          renderSummary(slot, data);
        });
        reviewSlots.forEach(function (slot) {
          renderReviews(slot, data);
        });
      })
      .catch(function () {
        console.warn('Google reviews data unavailable.');
        summarySlots.forEach(function (slot) {
          slot.innerHTML =
            '<p class="lx-google-fallback">' +
            (locale === 'fr'
              ? 'Avis Google indisponibles temporairement.'
              : 'Google reviews are temporarily unavailable.') +
            '</p>';
        });
        reviewSlots.forEach(function (slot) {
          slot.innerHTML =
            '<p class="lx-google-fallback">' +
            (locale === 'fr'
              ? 'Impossible de charger les avis pour le moment.'
              : 'Unable to load reviews right now.') +
            '</p>';
        });
      });
  }
})();
