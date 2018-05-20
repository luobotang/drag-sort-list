class DragSortList {
  /**
   * @param {Object} options
   * @param {Element} options.el - the list
   * @param {Element} options.key - element attribute name to identify each child, default: `id`
   * @param {Object} classNames - define class names used in DragSortList, default: {dragOrigin: 'drag-origin', dragClone: 'drag-clone'}
   * @param {Function} onchange - invoke on list sort changed: ({String[]} keys) => {}
   */
  constructor(options) {
    this.options = options
    this.el = options.el
    this.key = options.key || 'id'
    this.classNames = options.classNames || {dragOrigin: 'drag-origin', dragClone: 'drag-clone'}
    this.initialize()
  }

  initialize() {
    let dragStartClientY
    let dragStartTop
    let dragOrigin
    let dragClone

    this.events = {
      touchstart: (e) => {
        e.preventDefault()
        let touchedChild = this.getTouchedChild(e)
        if (!touchedChild) return
        dragStartClientY = e.touches[0].clientY
        dragOrigin = touchedChild
        dragStartTop = this.caclCloneChildTop(touchedChild)
        dragClone = this.makeCloneChild(touchedChild, dragStartTop)
      },
      touchmove: (e) => {
        e.preventDefault()
        if (!dragClone) return
        const move = e.touches[0].clientY - dragStartClientY
        dragClone.style.top = (dragStartTop + move) + 'px'
        const newTouchedChild = this.getTouchedChild(e)
        if (!newTouchedChild) return
        if (newTouchedChild !== dragClone && newTouchedChild !== dragOrigin) {
          this.swapPostion(dragOrigin, newTouchedChild)
          this.emit('change', this.getChildrenKeys())
        }
      },
      touchend: (e) => {
        e.preventDefault()
        this.removeCloneChild(dragClone, dragOrigin)
        dragOrigin = null
        dragClone = null
      }
    }

    Object.entries(this.events).forEach(([event, listener]) => {
      this.el.addEventListener(event, listener, false)
    })
  }

  destroy() {
    Object.entries(this.events).forEach(([event, listener]) => {
      this.el.removeEventListener(event, listener, false)
    })
  }

  emit(event, arg) {
    const fn = this.options['on' + event]
    if (typeof fn === 'function') fn(arg)
  }

  getTouchedChild(e) {
    const listRect = this.el.getBoundingClientRect()
    const touchData = e.touches[0]
    const distanceY = touchData.clientY - listRect.top

    const children = this.el.children
    for (let i = 0, child, sum = 0, len = children.length; i < len; i++) {
      child = children[i]
      let childRect = child.getBoundingClientRect()
      let childHeight = childRect.bottom - childRect.top
      sum += childHeight
      if (sum > distanceY) return child
    }
  }

  caclCloneChildTop(child) {
    return child.getBoundingClientRect().top - child.parentNode.getBoundingClientRect().top
  }

  makeCloneChild(child, top) {
    const cloneChild = child.cloneNode(true) // deep clone
    child.classList.add(this.classNames.dragOrigin)
    cloneChild.classList.add(this.classNames.dragClone)
    cloneChild.style.top = top + 'px'
    child.parentNode.appendChild(cloneChild)
    return cloneChild
  }

  removeCloneChild(cloneChild, child) {
    child.classList.remove(this.classNames.dragOrigin)
    cloneChild.parentNode.removeChild(cloneChild)
  }

  swapPostion(childA, childB) {
    const aTop = childA.getBoundingClientRect().top
    const bTop = childB.getBoundingClientRect().top
    if (aTop < bTop) {
      childA.parentNode.insertBefore(childB, childA)
    } else {
      childB.parentNode.insertBefore(childA, childB)
    }
  }

  getChildrenKeys() {
    const getChildKey = (child) => child.getAttribute(this.key)
    // exclude the last clone child
    return [].slice.call(this.el.children, 0, -1).map(getChildKey)
  }
}