var H5P = window.H5P = window.H5P || {};

H5P.ImageSlide = (function ($) {
  /**
   * Constructor function.
   */
  function C(options, contentId, extras) {
    var self = this;
    this.$ = $(this);
    H5P.EventDispatcher.call(this);

    // Listen resize events
    this.on('resize', () => {
      this.updateToggleButtonVisibility();
    });

    this.aspectRatio = this.originalAspectRatio = extras.aspectRatio;

    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      image: null,
      description: '',
      a11y: {
        expandDescription: 'Expand description',
        collapseDescription: 'Collapse description'
      }
    }, options);

    // Keep provided id.
    this.contentId = contentId;

    this.image = H5P.newRunnable(this.options.image, this.contentId);
    this.image.on('loaded', function () {
      self.trigger('loaded');
      self.trigger('resize');
    });
    this.description = this.options.description;
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    this.$container = $container;

    // Set class on container to identify it as an image slide container.
    $container.addClass("h5p-image-slide");

    this.$imageHolder = $('<div>', {
      class: 'h5p-image-slide-image-holder',
    });
    if (!this.aspectRatio) {
      this.$imageHolder.get(0).classList.add('no-fixed-aspect-ratio');
    }
    $container.append(this.$imageHolder);

    // Add image
    this.image.attach(this.$imageHolder);

    if (this.description) {
      this.descriptionContainer = document.createElement('div');
      this.descriptionContainer.classList.add('h5p-description-container');
      this.descriptionContainer.addEventListener('click', () => {
        this.toggleDescription();
      });
      $container.get(0).append(this.descriptionContainer);

      this.toggleButton = document.createElement('div');
      this.toggleButton.classList.add('h5p-description-toggle');
      this.toggleButton.setAttribute('role', 'button');
      this.descriptionContainer.append(this.toggleButton);

      const arrowIcon = document.createElement('div');
      arrowIcon.classList.add('arrow-icon');
      this.toggleButton.append(arrowIcon);

      this.descriptionText = document.createElement('div');
      this.descriptionText.classList.add('h5p-description-text');
      this.descriptionText.innerHTML = this.description;
      this.descriptionContainer.append(this.descriptionText);

      this.toggleDescription(false);
    }
  };

  /**
   * Get the minimum height of the description container.
   * @returns {number} Minimum height of the description container.
   */
  C.prototype.getDescriptionMinHeight = function () {
    return this.descriptionContainer?.clientHeight ?? 0;
  };

  /**
   * Get the size of the container.
   * @returns {object} Container size as {width, height}.
   */
  C.prototype.getContainerSize = function () {
    return {
      width: this.$container.get(0).clientWidth,
      height: this.$container.get(0).clientHeight
    };
  };

  /**
   * Get image size.
   * @returns {object} Image size as {width, height}.
   */
  C.prototype.getImageSize = function () {
    if (this.aspectRatio) {
      return {
        width: this.image.$img.get(0).clientWidth,
        height: this.image.$img.get(0).clientHeight
      };
    }
    else {
      // Image is not filling the container, so we need to calculate the size manually
      const containerSize = this.getContainerSize();
      const containerAspectRatio = containerSize.width / containerSize.height;
      const naturalAspectRatio = this.getNaturalAspectRatio();

      if (naturalAspectRatio >= containerAspectRatio) {
        return {
          width: containerSize.width,
          height: containerSize.width / naturalAspectRatio
        };
      }
      else {
        return {
          width: containerSize.height * naturalAspectRatio,
          height: containerSize.height
        };
      }
    }
  };

  C.prototype.getNaturalAspectRatio = function () {
    return this.image.$img.get(0).naturalWidth / this.image.$img.get(0).naturalHeight;
  }

  /**
   * Update the visibility of the toggle button based on whether the description text fits into the container.
   */
  C.prototype.updateToggleButtonVisibility = function () {
    if (!this.descriptionContainer) {
      return;
    }

    const containerStyle = window.getComputedStyle(this.descriptionContainer);
    const lineHeight = parseFloat(containerStyle.getPropertyValue('line-height'));
    const minLines = containerStyle.getPropertyValue('--min-lines');

    const textFitsIntoMinLines = this.descriptionText?.scrollHeight <= lineHeight * minLines;
    const textFitsIntoContainer = this.descriptionText?.scrollHeight <= this.descriptionText?.clientHeight;
    const textIsExpanded = !this.descriptionContainer.classList.contains('collapsed');

    this.toggleButton?.classList.toggle(
      'display-none',
      textFitsIntoMinLines || textFitsIntoContainer && !textIsExpanded
    );
  };

  /**
   * Toggle description to be expanded or collapsed.
   * @param {Boolean} [expanded] Forced state of the description.
   */
  C.prototype.toggleDescription = function(expanded) {
    if (!this.descriptionContainer) {
      return;
    }

    const shouldbeCollapsed = typeof expanded === 'boolean' ? !expanded : undefined;
    expanded = this.descriptionContainer.classList.toggle('collapsed', shouldbeCollapsed);

    const ariaLabel = expanded ? this.options.a11y.collapseDescription : this.options.a11y.expandDescription;
    this.toggleButton.setAttribute('aria-label', ariaLabel);

    this.trigger('sizeChanged');
  };

  /**
   * Set the aspect ratio for this slide
   *
   * @param {Integer} newAspectRatio the aspect ratio
   */
  C.prototype.setAspectRatio = function (newAspectRatio) {
    this.aspectRatio = newAspectRatio;
  };

  /**
   * Reset the aspect ratio to the previously set aspect ratio
   *
   * Typically used when exiting fullscreen mode
   */
  C.prototype.resetAspectRatio = function () {
    this.aspectRatio = this.originalAspectRatio;
  };

  return C;
})(H5P.jQuery);
