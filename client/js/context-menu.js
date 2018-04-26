import './../css/context-menu.css';

export default function () {
  this.items = [];

  this.addItem = function (item) {
    this.items.push({
      isSimpleItem: true,
      name: item.name,
      action: item.action,
    });
  };

  this.addSubMenu = function (item) {
    this.items.push({
      isSimpleItem: false,
      name: item.name,
      menu: new ContextMenu(),
    });
    this.items[this.items.length - 1].menu.setItems(item.items);
  };

  this.removeItemByName = function (name) {
    for (let i = this.items.length - 1; i > 0; i--) {
      if (this.items[i].name.valueOf() === name.valueOf()) {
        this.items.splice(i, 1);
        break;
      }
    }
  };

  this.setItems = function (items) {
    this.items = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].name) {
        if (items[i].action) {
          this.addItem(items[i]);
        } else if (items[i].items) {
          this.addSubMenu(items[i]);
        }
      }
    }
  };

  this.showMenu = function (event, parent, items) {
    if (items) {
      this.setItems(items);
    }

    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }

    if (event.stopPropagation) {
      event.stopPropagation();
    }

    this.initMenu(parent);
    const bbox = this.DOMObj.getBoundingClientRect();
    if ((event.clientY + window.scrollY + bbox.height) < window.innerHeight || (event.clientX + bbox.width) < window.innerWidth) {
      this.DOMObj.style.top = `${event.clientY + window.scrollY}px`;
      this.DOMObj.style.left = `${event.clientX}px`;
    } else {
      this.DOMObj.style.top = `${event.clientY + window.scrollY - bbox.height}px`;
      this.DOMObj.style.left = `${event.clientX - bbox.width}px`;
    }

    const hideMenu = () => {
      if (this.DOMObj && this.DOMObj.parentNode && this.DOMObj.parentNode.removeChild) {
        this.DOMObj.parentNode.removeChild(this.DOMObj);
      }
      this.onclick = undefined;
      document.removeEventListener('click', hideMenu);
      document.removeEventListener('drag', hideMenu);
    };
    setTimeout(() => {
      document.addEventListener('click', hideMenu);
      document.removeEventListener('drag', hideMenu);
    }, 225);
  };

  this.initMenu = function (parent) {
    if (this.DOMObj && this.DOMObj.parentNode && this.DOMObj.parentNode.removeChild) {
      this.DOMObj.parentNode.removeChild(this.DOMObj);
    }
    const self = this;
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    const list = document.createElement('ul');
    menu.appendChild(list);
    for (let i = 0; i < this.items.length; i++) {
      const item = document.createElement('li');
      list.appendChild(item);
      item.setAttribute('data-index', i);
      const name = document.createElement('span');
      name.className = 'context-menu-item-name';
      name.textContent = this.items[i].name;
      item.appendChild(name);
      if (this.items[i].isSimpleItem) {
        item.onclick = function () {
          const ix = this.getAttribute('data-index');
          self.items[ix].action();
        };
      } else {
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.innerHTML = '&#9658;';
        name.appendChild(arrow);
        this.items[i].menu.initMenu(item);
        this.items[i].menu.DOMObj.style.display = 'none';
        item.onmouseover = function () {
          setTimeout(() => {
            this.querySelectorAll('.context-menu')[0].style.display = '';
          }, 500);
        };
        item.onmouseout = function () {
          setTimeout(() => {
            this.querySelectorAll('.context-menu')[0].style.display = 'none';
          }, 500);
        };
      }
    }
    this.DOMObj = menu;
    parent.appendChild(menu);
  };
}
