export function check_remove_existing_box(box_selector) {
  const existing_box = document.querySelector(box_selector);
  if (existing_box) existing_box.remove();
}

export function make_dialog_container(id_box, title, class_box) {
  const _id_box = id_box || 'dialog';
  const _title = title || '';
  const _class_box = class_box || 'dialog';
  const container = document.createElement('div');
  container.setAttribute('id', id_box);
  container.setAttribute('class', `twbs modal fade ${_class_box}`);
  container.setAttribute('tabindex', '-1');
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-labelledby', 'myModalLabel');
  container.setAttribute('aria-hidden', 'true');
  container.innerHTML = '<div class="modal-dialog"><div class="modal-content"></div></div>';
  document.getElementById('twbs').appendChild(container);
  const html_content = `<div class="modal-header">
    <button type="button" id="xclose" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
    <h4 class="modal-title" id="gridModalLabel">${_title}</h4>
    </div>
    <div class="modal-body"> </div>
    <div class="modal-footer">
    <button type="button" class="btn btn-primary btn_ok" data-dismiss="modal">${i18next.t('app_page.common.confirm')}</button>
    <button type="button" class="btn btn-default btn_cancel">${i18next.t('app_page.common.cancel')}</button>
    </div>`;
  const modal_box = new Modal(document.getElementById(_id_box), { content: html_content });
  modal_box.show();
  return modal_box;
}

export const overlay_under_modal = (function () {
  const twbs_div = document.querySelector('.twbs');
  const bg = document.createElement('div');
  bg.id = 'overlay_twbs';
  bg.style.width = '100%';
  bg.style.height = '100%';
  bg.style.position = 'fixed';
  bg.style.zIndex = 99;
  bg.style.top = 0;
  bg.style.left = 0;
  bg.style.background = 'rgba(0,0,0,0.4)';
  bg.style.display = 'none';
  twbs_div.insertBefore(bg, twbs_div.childNodes[0]);
  return {
    display: function () { bg.style.display = ''; },
    hide: function () { bg.style.display = 'none'; },
  };
})();

export const make_confirm_dialog2 = (function (class_box, title, options) {
  const get_available_id = () => {
    for (let i = 0; i < 50; i++) {
      if (!existing.has(i)) {
        existing.add(i);
        return i;
      }
    }
  };
  let existing = new Set();
  return (class_box, title, options) => {
    class_box = class_box || 'dialog';
    title = title || i18next.t('app_page.common.ask_confirm');
    options = options || {};

    let container = document.createElement('div');
    const new_id = get_available_id();

    container.setAttribute('id', `myModal_${new_id}`);
    container.setAttribute('class', `twbs modal fade ${class_box}`);
    container.setAttribute('tabindex', '-1');
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-labelledby', 'myModalLabel');
    container.setAttribute('aria-hidden', 'true');
    container.innerHTML = options.widthFitContent ? '<div class="modal-dialog fitContent"><div class="modal-content"></div></div>'
                        : '<div class="modal-dialog"><div class="modal-content"></div></div>';
    document.getElementById('twbs').appendChild(container);

    container = document.getElementById(`myModal_${new_id}`);
    const deferred = Promise.pending();
    const text_ok = options.text_ok || i18next.t('app_page.common.confirm');
    const text_cancel = options.text_cancel || i18next.t('app_page.common.cancel');
    const html_content = `<div class="modal-header">
      <button type="button" id="xclose" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title" id="gridModalLabel">${title}</h4>
      </div>
      <div class="modal-body"><p>${options.html_content || ''}</p></div>
      <div class="modal-footer">
      <button type="button" class="btn btn-primary btn_ok" data-dismiss="modal">${text_ok}</button>
      <button type="button" class="btn btn-default btn_cancel">${text_cancel}</button>
      </div>`;
    const modal_box = new Modal(container, {
      backdrop: true,
      keyboard: false,
      content: html_content,
    });
    modal_box.show();
    container.modal = modal_box;
    overlay_under_modal.display();
    const func_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose_false); };
    const clean_up_box = () => {
      document.removeEventListener('keydown', func_cb);
      existing.delete(new_id);
      overlay_under_modal.hide();
      container.remove();
    };
    let _onclose_false = () => {
      deferred.resolve(false);
      clean_up_box();
    };
    container.querySelector('.btn_cancel').onclick = _onclose_false;
    container.querySelector('#xclose').onclick = _onclose_false;
    container.querySelector('.btn_ok').onclick = () => {
      deferred.resolve(true);
      clean_up_box();
    };
    document.addEventListener('keydown', func_cb);
    return deferred.promise;
  };
})();
