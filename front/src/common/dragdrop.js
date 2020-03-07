export default function(Vue) {

  const proxyOffset = 6;

  let _inited = false;

  let _isDragging = false;
  let _isMoved = false;
  let _dragHandler = null;
  let _dragElement = null;
  let _dragContext = null;
  let _dropHandler = null;
  let _dropElement = null;
  let _dropContext = null;
  let _proxyElement = null;
  let _dragElementSize = {};
  const _touchStart = {};
  let _delayTimeout = 0;

  function _getDragElement($el, context) {
    if (!context.onDragElement) return $el;
    const res = context.onDragElement({ $el, context });
    if (res === undefined) return $el;
    if (res) return res;
    return null;
  }

  function _getDropElement($el, context, dragElement, dragConext) {
    if (!context.onDropElement) return $el;
    const res = context.onDropElement({ $el, context, dragElement, dragConext });
    if (res === undefined) return $el;
    if (res) return res;
    return null;
  }

  function handeTouchStart(e) {
    const $$ = Vue.prototype.$$;
    // el
    const $el = $$(e.target).closest('.eb-dragdrop-handler');
    if ($el.length === 0) return;
    // context
    const context = $el[0].__eb_dragContext;
    if (!context) return;
    // delay
    _delayTimeout = window.setTimeout(() => {
      if (!_delayTimeout) return;
      _delayTimeout = 0;
      // get drag element
      _dragElement = _getDragElement($el, context);
      if (!_dragElement) return; // break
      // size
      _dragElementSize = {
        width: _dragElement.width(),
        height: _dragElement.height(),
      };
      // touch
      _touchStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      _touchStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      // proxy
      if (!_proxyElement) {
        _proxyElement = $$('<div class="eb-dragdrop-proxy"></div>');
        $$('body').append(_proxyElement);
      }
      // proxy size
      _proxyElement.css({
        left: `${_touchStart.x + proxyOffset}px`,
        top: `${_touchStart.y + proxyOffset}px`,
        width: `${_dragElementSize.width / 2}px`,
        height: `${_dragElementSize.height / 2}px`,
      });
      _proxyElement.show();
      // start
      context.onDragStart && context.onDragStart({ $el, context, dragElement: _dragElement });
      _dragElement.addClass('eb-dragdrop-drag');
      // ready
      _isMoved = false;
      _isDragging = true;
      _dragHandler = $el;
      _dragContext = context;
      _dropHandler = null;
      _dropElement = null;
      _dropContext = null;
    }, 200);
  }

  function _checkMoveElement($el) {
    if ($el.length === 0) return null;
    if ($el.is(_dragHandler)) return null; // not self
    // context
    const context = $el[0].__eb_dragContext;
    if (!context) return null;
    if (context.scene !== _dragContext.scene) return null; // not same scene

    // check if can drop
    return _getDropElement($el, context, _dragElement, _dragContext);
  }

  function handeTouchMove(e) {
    if (!_isDragging) return;
    const $$ = Vue.prototype.$$;
    // el
    const $el = $$(e.target).closest('.eb-dragdrop-handler');
    // drop element
    const dropElementNew = _checkMoveElement($el);
    const dropContextNew = dropElementNew ? $el[0].__eb_dragContext : null;
    const dropHandlerNew = dropElementNew ? $el : null;

    const _dropElementEl = _dropElement ? _dropElement[0] : null;
    const dropElementNewEl = dropElementNew ? dropElementNew[0] : null;
    if (_dropElementEl !== dropElementNewEl) {
      // leave
      if (_dropElement) {
        _dropContext.onDropLeave && _dropContext.onDropLeave({ $el: _dropHandler, context: _dropContext, dropElement: _dropElement });
        _dropElement.removeClass('eb-dragdrop-drop');
      }
      // enter
      if (dropElementNew) {
        dropContextNew.onDropEnter && dropContextNew.onDropEnter({ $el: dropHandlerNew, context: dropContextNew, dropElement: dropElementNew });
        dropElementNew.addClass('eb-dragdrop-drop');
      }
      // switch
      _dropElement = dropElementNew;
      _dropContext = dropContextNew;
      _dropHandler = dropHandlerNew;
    }

    _isMoved = true;
    e.preventDefault();

    // proxy position
    const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
    const pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
    _proxyElement.css({
      left: `${pageX + proxyOffset}px`,
      top: `${pageY + proxyOffset}px`,
    });

  }

  function _clearDragdrop() {
    if (_isDragging) {
      // proxy
      if (_proxyElement) {
        _proxyElement.hide();
      }
      // dropElement
      if (_dropElement) {
        _dropContext.onDropLeave && _dropContext.onDropLeave({ $el: _dropHandler, context: _dropContext, dropElement: _dropElement });
        _dropElement.removeClass('eb-dragdrop-drop');
      }
      // dragElement
      if (_dragElement) {
        _dragContext.onDragEnd && _dragContext.onDragEnd({ $el: _dragHandler, context: _dragContext, dragElement: _dragElement });
        _dragElement.removeClass('eb-dragdrop-drag');
      }
    }
    _isMoved = false;
    _isDragging = false;
    _dragHandler = null;
    _dragElement = null;
    _dragContext = null;
    _dropHandler = null;
    _dropElement = null;
    _dropContext = null;
  }

  function handeTouchEnd(e) {
    // clear delay
    if (_delayTimeout) {
      window.clearTimeout(_delayTimeout);
      _delayTimeout = 0;
    }

    if (!_isDragging || !_isMoved) {
      _clearDragdrop();
      return;
    }

    // drop done
    if (_dropElement) {
      _dragContext.onDragDone && _dragContext.onDragDone({
        $el: _dragHandler, context: _dragContext, dragElement: _dragElement,
        dropElement: _dropElement, dropContext: _dropContext,
      });
    }

    // clear
    _clearDragdrop();
  }

  function initialize() {
    if (_inited) return;
    _inited = true;
    const app = Vue.prototype.$f7;
    app.on('touchstart:passive', handeTouchStart);
    app.on('touchmove:active', handeTouchMove);
    app.on('touchend:passive', handeTouchEnd);
  }

  function bind(el, context) {
    const $el = Vue.prototype.$$(el);
    $el.addClass('eb-dragdrop-handler');
    el.__eb_dragContext = context;
  }

  function unbind(el) {
    const $el = Vue.prototype.$$(el);
    $el.removeClass('eb-dragdrop-handler');
    el.__eb_dragContext = null;
  }

  return {
    initialize,
    bind,
    unbind,
  };

}

