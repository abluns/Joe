import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { defaultKeymap, defaultTabBinding } from '@codemirror/commands';
import { history, historyKeymap, undo, redo } from '@codemirror/history';
import { classHighlightStyle } from '@codemirror/highlight';

class JoeAction {
	constructor() {
		$('body').append('<div class="cm-modal"><div class="cm-modal__wrapper"><div class="cm-modal__wrapper-header"></div><div class="cm-modal__wrapper-bodyer"></div><div class="cm-modal__wrapper-footer"><button class="cm-modal__wrapper-footer--cancle">取消</button><button class="cm-modal__wrapper-footer--confirm">确定</button></div></div></div>');
		$('.cm-modal__wrapper-footer--cancle').on('click', () => {
			this.options.cancel();
			$('.cm-modal').removeClass('active');
		});
		$('.cm-modal__wrapper-footer--confirm').on('click', () => {
			this.options.confirm();
			$('.cm-modal').removeClass('active');
		});
	}
	_openModal(options = {}) {
		const _options = {
			title: '提示',
			innerHtml: '内容',
			cancel: () => {},
			confirm: () => {}
		};
		this.options = Object.assign(_options, options);
		$('.cm-modal__wrapper-header').html(this.options.title);
		$('.cm-modal__wrapper-bodyer').html(this.options.innerHtml);
		$('.cm-modal').addClass('active');
	}
	_getLineCh(cm) {
		const head = cm.state.selection.main.head;
		const line = cm.state.doc.lineAt(head);
		return head - line.from;
	}
	_replaceSelection(cm, str) {
		cm.dispatch(cm.state.replaceSelection(str));
	}
	_setCursor(cm, pos) {
		cm.dispatch({ selection: { anchor: pos } });
	}
	_getSelection(cm) {
		return cm.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to);
	}
	_insetAmboText(cm, str) {
		const cursor = cm.state.selection.main.head;
		const selection = this._getSelection(cm);
		this._replaceSelection(cm, ` ${str + selection + str} `);
		if (selection === '') this._setCursor(cm, cursor + str.length + 1);
		cm.focus();
	}
	handleFullScreen(el) {
		el.toggleClass('active');
		$('body').toggleClass('fullscreen');
		$('.cm-container').toggleClass('fullscreen');
		$('.cm-preview').width(0);
	}
	handlePublish() {
		$('#btn-submit').click();
	}
	handleUndo(cm) {
		undo(cm);
		cm.focus();
	}
	handleRedo(cm) {
		redo(cm);
		cm.focus();
	}
	handleIndent(cm) {
		this._replaceSelection(cm, '　');
		cm.focus();
	}
	handleTime(cm) {
		const time = new Date();
		const _Year = time.getFullYear();
		const _Month = String(time.getMonth() + 1).padStart(2, 0);
		const _Date = String(time.getDate()).padStart(2, 0);
		const _Hours = String(time.getHours()).padStart(2, 0);
		const _Minutes = String(time.getMinutes()).padStart(2, 0);
		const _Seconds = String(time.getSeconds()).padStart(2, 0);
		const _Day = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][time.getDay()];
		const _time = `${this._getLineCh(cm) ? '\n' : ''}${_Year}-${_Month}-${_Date} ${_Hours}:${_Minutes}:${_Seconds} ${_Day}\n`;
		this._replaceSelection(cm, _time);
		cm.focus();
	}
	handleHr(cm) {
		const str = `${this._getLineCh(cm) ? '\n' : ''}\n------------\n\n`;
		this._replaceSelection(cm, str);
		cm.focus();
	}
	handleClean(cm) {
		cm.dispatch({ changes: { from: 0, to: cm.state.doc.length, insert: '' } });
		cm.focus();
	}
	handleOrdered(cm) {
		const selection = this._getSelection(cm);
		if (selection === '') {
			const str = (this._getLineCh(cm) ? '\n\n' : '') + '1. ';
			this._replaceSelection(cm, str);
		} else {
			const selectionText = selection.split('\n');
			for (let i = 0, len = selectionText.length; i < len; i++) {
				selectionText[i] = selectionText[i] === '' ? '' : i + 1 + '. ' + selectionText[i];
			}
			const str = (this._getLineCh(cm) ? '\n' : '') + selectionText.join('\n');
			this._replaceSelection(cm, str);
		}
		cm.focus();
	}
	handleUnordered(cm) {
		const selection = this._getSelection(cm);
		if (selection === '') {
			const str = (this._getLineCh(cm) ? '\n' : '') + '- ';
			this._replaceSelection(cm, str);
		} else {
			const selectionText = selection.split('\n');
			for (let i = 0, len = selectionText.length; i < len; i++) {
				selectionText[i] = selectionText[i] === '' ? '' : '- ' + selectionText[i];
			}
			const str = (this._getLineCh(cm) ? '\n' : '') + selectionText.join('\n');
			this._replaceSelection(cm, str);
		}
		cm.focus();
	}
	handleQuote(cm) {
		const selection = this._getSelection(cm);
		if (selection === '') {
			this._replaceSelection(cm, `${this._getLineCh(cm) ? '\n' : ''}> `);
		} else {
			const selectionText = selection.split('\n');
			for (let i = 0, len = selectionText.length; i < len; i++) {
				selectionText[i] = selectionText[i] === '' ? '' : '> ' + selectionText[i];
			}
			const str = (this._getLineCh(cm) ? '\n' : '') + selectionText.join('\n');
			this._replaceSelection(cm, str);
		}
		cm.focus();
	}
	handleDownload(cm) {
		const title = $('#title').val() || '新文章';
		const aTag = document.createElement('a');
		let blob = new Blob([cm.state.doc.toString()]);
		aTag.download = title + '.md';
		aTag.href = URL.createObjectURL(blob);
		aTag.click();
		URL.revokeObjectURL(blob);
	}
	handleTitle(cm, tool) {
		const item = $(`
			<div class="cm-tools-item" title="${tool.title}">
				${tool.innerHTML}
				<div class="cm-tools__dropdown">
					<div class="cm-tools__dropdown-item" data-text="# "> H1 </div>
					<div class="cm-tools__dropdown-item" data-text="## "> H2 </div>
					<div class="cm-tools__dropdown-item" data-text="### "> H3 </div>
					<div class="cm-tools__dropdown-item" data-text="#### "> H4 </div>
					<div class="cm-tools__dropdown-item" data-text="##### "> H5 </div>
					<div class="cm-tools__dropdown-item" data-text="###### "> H6 </div>
				</div>
			</div>
		`);
		item.on('click', function (e) {
			e.stopPropagation();
			$(this).toggleClass('active');
		});
		const _this = this;
		item.on('click', '.cm-tools__dropdown-item', function (e) {
			e.stopPropagation();
			const text = $(this).attr('data-text');
			if (_this._getLineCh(cm)) _this._replaceSelection(cm, '\n\n' + text);
			else _this._replaceSelection(cm, text);
			item.removeClass('active');
			cm.focus();
		});
		$(document).on('click', () => item.removeClass('active'));
		$('.cm-tools').append(item);
	}
	handleLink(cm) {
		this._openModal({
			title: '插入链接',
			innerHtml: `
                <div class="fitem">
                    <label>链接标题</label>
                    <input autocomplete="off" name="title" placeholder="请输入链接标题"/>
                </div>
                <div class="fitem">
                    <label>链接地址</label>
                    <input autocomplete="off" name="url" placeholder="请输入链接地址"/>
                </div>
            `,
			confirm: () => {
				const title = $(".cm-modal input[name='title']").val() || 'Test';
				const url = $(".cm-modal input[name='url']").val() || 'http://';
				this._replaceSelection(cm, ` [${title}](${url}) `);
				cm.focus();
			}
		});
	}
	handleImage(cm) {
		this._openModal({
			title: '插入图片',
			innerHtml: `
                <div class="fitem">
                    <label>图片名称</label>
                    <input autocomplete="off" name="title" placeholder="请输入图片名称"/>
                </div>
                <div class="fitem">
                    <label>图片地址</label>
                    <input autocomplete="off" name="url" placeholder="请输入图片地址"/>
                </div>
            `,
			confirm: () => {
				const title = $(".cm-modal input[name='title']").val() || 'Test';
				const url = $(".cm-modal input[name='url']").val() || 'http://';
				this._replaceSelection(cm, ` ![${title}](${url}) `);
				cm.focus();
			}
		});
	}
	handleTable(cm) {
		this._openModal({
			title: '插入表格',
			innerHtml: `
                <div class="fitem">
                    <label>表格行</label>
                    <input style="width: 50px; flex: none; margin-right: 10px;" value="3" autocomplete="off" name="row"/>
                    <label>表格列</label>
                    <input style="width: 50px; flex: none;" value="3" autocomplete="off" name="column"/>
                </div>
            `,
			confirm: () => {
				let row = $(".cm-modal input[name='row']").val();
				let column = $(".cm-modal input[name='column']").val();
				if (isNaN(row)) row = 3;
				if (isNaN(column)) column = 3;
				let rowStr = '';
				let rangeStr = '';
				let columnlStr = '';
				for (let i = 0; i < column; i++) {
					rowStr += '| 表头 ';
					rangeStr += '| :--: ';
				}
				for (let i = 0; i < row; i++) {
					for (let j = 0; j < column; j++) columnlStr += '| 表格 ';
					columnlStr += '|\n';
				}
				const htmlStr = `${rowStr}|\n${rangeStr}|\n${columnlStr}\n`;
				if (this._getLineCh(cm)) this._replaceSelection(cm, '\n\n' + htmlStr);
				else this._replaceSelection(cm, htmlStr);
				cm.focus();
			}
		});
	}
	handleCodeBlock(cm) {
		this._openModal({
			title: '插入代码块',
			innerHtml: `
                <div class="fitem">
                    <label>语言类型</label>
                    <input autocomplete="off" name="type" placeholder="请输入语言类型（英文）"/>
                </div>
            `,
			confirm: () => {
				const type = $(".cm-modal input[name='type']").val() || 'html';
				const htmlStr = `\`\`\`${type}\ncode here...\n\`\`\``;
				if (this._getLineCh(cm)) this._replaceSelection(cm, '\n\n' + htmlStr);
				else this._replaceSelection(cm, htmlStr);
				cm.focus();
			}
		});
	}
	handleAbout() {
		this._openModal({
			title: '关于',
			innerHtml: `
                <ul>
                    <li>短代码功能正在开发中...</li>
                    <li>仅支持网络图片粘贴上传（截图等）</li>
                    <li>本编辑器仅供Joe主题使用，未经允许不得移植至其他主题！</li>
                </ul>
            `
		});
	}
}

class Joe extends JoeAction {
	constructor() {
		super();
		this.tools = [
			{
				type: 'undo',
				title: '撤销',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M76 463.7l294.8 294.9c19.5 19.4 52.8 5.6 52.8-21.9V561.5c202.5-8.2 344.1 59.5 501.6 338.3 8.5 15 31.5 7.9 30.6-9.3-30.5-554.7-453-571.4-532.3-569.6v-174c0-27.5-33.2-41.3-52.7-21.8L75.9 420c-12 12.1-12 31.6.1 43.7z"/></svg>'
			},
			{
				type: 'redo',
				title: '重做',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M946.8 420L651.9 125.1c-19.5-19.5-52.7-5.7-52.7 21.8v174c-79.3-1.8-501.8 14.9-532.3 569.6-.9 17.2 22.1 24.3 30.6 9.3C255 621 396.6 553.3 599.1 561.5v175.2c0 27.5 33.3 41.3 52.8 21.9l294.8-294.9c12.1-12.1 12.1-31.6.1-43.7z"/></svg>'
			},
			{
				type: 'bold',
				title: '加粗',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M341.333 469.333h192a106.667 106.667 0 1 0 0-213.333h-192v213.333zm426.667 192a192 192 0 0 1-192 192H256V170.667h277.333a192 192 0 0 1 138.923 324.522A191.915 191.915 0 0 1 768 661.333zM341.333 554.667V768H576a106.667 106.667 0 1 0 0-213.333H341.333z"/></svg>'
			},
			{
				type: 'italic',
				title: '倾斜',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M640 853.333H298.667V768h124.885l90.283-512H384v-85.333h341.333V256H600.448l-90.283 512H640z"/></svg>'
			},
			{
				type: 'delete',
				title: '删除',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M731.904 597.333c9.813 22.016 14.763 46.507 14.763 73.387 0 57.259-22.358 102.059-67.03 134.272-44.757 32.213-106.496 48.341-185.301 48.341-69.973 0-139.221-16.256-207.787-48.81v-96.256c64.854 37.418 131.2 56.149 199.083 56.149 108.843 0 163.413-31.232 163.797-93.739a94.293 94.293 0 0 0-27.648-68.394l-5.12-4.992H128v-85.334h768v85.334H731.904zm-173.995-128H325.504a174.336 174.336 0 0 1-20.523-22.272c-18.432-23.808-27.648-52.565-27.648-86.442 0-52.736 19.883-97.579 59.606-134.528 39.808-36.95 101.29-55.424 184.533-55.424 62.763 0 122.837 13.994 180.139 41.984v91.818c-51.2-29.312-107.307-43.946-168.363-43.946-105.813 0-158.677 33.365-158.677 100.096 0 17.92 9.301 33.536 27.904 46.89 18.602 13.355 41.557 23.979 68.821 32 26.453 7.68 55.339 17.664 86.613 29.824z"/></svg>'
			},
			{
				type: 'code-inline',
				title: '行内代码',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M416.328 512.336a96 96 0 1 0 192 0 96 96 0 1 0-192 0zM336.328 860c-12.288 0-24.568-6-33.944-17.992l-224-286.584c-18.744-23.984-18.744-62.856 0-86.84l224-286.592c18.744-23.976 49.136-23.976 67.88 0 18.744 23.984 18.744 62.864 0 86.848L180.208 512l190.056 243.168c18.744 23.968 18.744 62.856 0 86.832-9.368 12-21.648 18-33.936 18zm352 0c12.28 0 24.568-6 33.936-17.992l224-286.584c18.752-23.984 18.752-62.856 0-86.84l-224-286.592c-18.744-23.976-49.136-23.976-67.872 0-18.752 23.984-18.752 62.864 0 86.848L844.448 512 654.392 755.168c-18.752 23.968-18.752 62.856 0 86.832 9.376 12 21.656 18 33.936 18z"/></svg>'
			},
			{
				type: 'indent',
				title: '缩进',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M692.019 192c-22.087 0-39.992 17.935-39.992 40.059v277.192c-.638-9.212-4.471-18.244-11.522-25.286l-280.74-280.353c-15.504-15.483-40.643-15.483-56.147 0-15.505 15.483-15.505 40.587 0 56.07L556.282 512 303.617 764.316c-15.505 15.482-15.505 40.587 0 56.07 15.504 15.484 40.643 15.483 56.146 0l280.74-280.352a40.074 40.074 0 0 0 2.726-3.012c5.322-6.517 8.247-14.329 8.797-22.275V791.82c0 22.122 17.905 40.057 39.992 40.057s39.993-17.935 39.993-40.057V232.059c.001-22.124-17.906-40.059-39.992-40.059z"/></svg>'
			},
			{
				type: 'hr',
				title: '横线',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M896 469.333H128c-25.6 0-42.667 17.067-42.667 42.667S102.4 554.667 128 554.667h768c25.6 0 42.667-17.067 42.667-42.667S921.6 469.333 896 469.333z"/></svg>'
			},
			{
				type: 'quote',
				title: '引用',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M195.541 739.03C151.595 692.351 128 640 128 555.135c0-149.333 104.832-283.179 257.28-349.355l38.101 58.795c-142.293 76.97-170.112 176.853-181.205 239.83 22.912-11.862 52.907-16 82.304-13.27 76.97 7.125 137.643 70.315 137.643 148.864a149.333 149.333 0 0 1-149.334 149.333 165.163 165.163 0 0 1-117.248-50.304zm426.667 0c-43.947-46.678-67.541-99.03-67.541-183.894 0-149.333 104.832-283.179 257.28-349.355l38.101 58.795c-142.293 76.97-170.112 176.853-181.205 239.83 22.912-11.862 52.906-16 82.304-13.27 76.97 7.125 137.642 70.315 137.642 148.864a149.333 149.333 0 0 1-149.333 149.333 165.163 165.163 0 0 1-117.248-50.304z"/></svg>'
			},
			{
				type: 'title',
				title: '标题',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="22" height="22"><path d="M256 213.333h104.875v267.094h324.48V213.333h104.874v640H685.355V570.07h-324.48v283.264H256z"/></svg>'
			},
			{
				type: 'ordered-list',
				title: '有序列表',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M341.333 170.667H896V256H341.333v-85.333zm-128-42.667v128H256v42.667H128V256h42.667v-85.333H128V128h85.333zM128 597.333V490.667h85.333v-21.334H128v-42.666h128v106.666h-85.333v21.334H256v42.666H128zM213.333 832H128v-42.667h85.333V768H128v-42.667h128V896H128v-42.667h85.333V832zm128-362.667H896v85.334H341.333v-85.334zm0 298.667H896v85.333H341.333V768z"/></svg>'
			},
			{
				type: 'unordered-list',
				title: '无序列表',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M341.333 170.667H896V256H341.333v-85.333zM192 277.333a64 64 0 1 1 0-128 64 64 0 0 1 0 128zM192 576a64 64 0 1 1 0-128 64 64 0 0 1 0 128zm0 294.4a64 64 0 1 1 0-128 64 64 0 0 1 0 128zm149.333-401.067H896v85.334H341.333v-85.334zm0 298.667H896v85.333H341.333V768z"/></svg>'
			},
			{
				type: 'link',
				title: '超链接',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="15" height="15"><path d="M879.2 131.6c-103-95.5-264.1-88-361.4 11.2L474.7 184c-13.1 13.1-3.7 35.6 13.1 37.5 26.2 1.9 52.4 7.5 78.7 15 7.5 1.9 16.9 0 22.5-5.6l9.4-9.4c54.3-54.3 142.3-59.9 198.5-11.2 63.7 54.3 65.5 151.7 7.5 209.7L662 562.3c-18.7 18.7-41.2 30-63.7 37.5-30 7.5-61.8 5.6-89.9-5.6-16.9-7.5-33.7-16.9-48.7-31.8-7.5-7.5-13.1-15-18.7-24.3-7.5-13.1-24.3-15-33.7-3.7l-52.4 52.4c-7.5 7.5-7.5 18.7-1.9 28.1 7.5 11.2 16.9 20.6 26.2 30 13.1 13.1 30 26.2 44.9 35.6 26.2 16.9 56.2 28.1 86.1 33.7 58.1 11.2 121.7 1.9 174.2-26.2 20.6-11.2 41.2-26.2 58.1-43.1l142.3-142.3c104.9-103.2 101.2-271.8-5.6-371zM534.7 803.9l-39.3-5.6s-26.2-5.6-39.3-11.2c-7.5-1.9-16.9 0-22.5 5.6l-9.4 9.4c-54.3 54.3-142.3 59.9-198.5 11.2-63.7-54.3-65.5-151.7-7.5-209.7l142.3-142.3c18.7-18.7 41.2-30 63.7-37.5 30-7.5 61.8-5.6 89.9 5.6 16.9 7.5 33.7 16.9 48.7 31.8 7.5 7.5 13.1 15 18.7 24.3 7.5 13.1 24.3 15 33.7 3.7l52.4-52.4c7.5-7.5 7.5-18.7 1.9-28.1-7.5-11.2-16.9-20.6-26.2-30-13.1-13.1-28.1-26.2-44.9-35.6-26.2-16.9-56.2-28.1-88-33.7-58.1-11.2-121.7-1.9-174.2 26.2-20.6 11.2-41.2 26.2-58.1 43.1L141.4 515.5c-99.3 99.3-106.7 260.3-11.2 361.4C229.5 985.5 398 987.4 501 884.4l46.8-46.8c13.1-9.4 3.7-31.9-13.1-33.7z"/></svg>'
			},
			{
				type: 'image',
				title: '插入图片',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M46.545 977.455V46.545h930.91v930.91zm93.091-186.182v93.09h744.728V717.918l-214.11-228.305zm0-107.055l548.585-311.854 196.143 209.454V139.636H139.636zm99.282-376.227a82.758 82.758 0 0 1 82.758-82.758 82.758 82.758 0 0 1 82.757 82.758 82.758 82.758 0 0 1-82.757 82.805 82.804 82.804 0 0 1-82.758-82.898z"/></svg>'
			},
			{
				type: 'table',
				title: '表格',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M892.8 108h-763c-26.2 0-47.5 21.3-47.5 47.5v714c0 26.2 21.3 47.5 47.5 47.5h763c26.2 0 47.5-21.3 47.5-47.5v-714c0-26.2-21.3-47.5-47.5-47.5zm-291 294.7v172.1H411.7V402.7h190.1zm76 0h186.5v172.1H677.8V402.7zM864.3 184v142.7h-706V184h706zM158.4 841V402.7h177.3v172.1H159.8v76h175.9v188.9h76V650.8h190.1v188.9h76V650.8h186.5V841H158.4z"/></svg>'
			},
			{
				type: 'code-block',
				title: '代码块',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M902.4 454.4l-144-144a40.704 40.704 0 0 0-57.6 57.6l144 144-144 144a40.704 40.704 0 0 0 57.6 57.6l144-144a81.472 81.472 0 0 0 0-115.2zm-636.8-144l-144 144a81.472 81.472 0 0 0 0 115.2l144 144a40.704 40.704 0 0 0 57.6-57.6l-144-144 144-144a40.704 40.704 0 0 0-57.6-57.6zm109.568 544.064l195.072-706.56a40.704 40.704 0 0 1 78.528 21.632l-195.072 706.56a40.704 40.704 0 0 1-78.528-21.696z" /></svg>'
			},
			{
				type: 'time',
				title: '当前时间',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"/></svg>'
			},
			{
				type: 'clean',
				title: '清屏',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M479.3 863.6L899.9 443c37.4-37.4 37.4-98.3 0-135.8L716.7 124.1C698.5 106 674.4 96 648.7 96c-25.8 0-50.4 10.8-68.6 29l-455 455c-18.2 18.2-29 42.8-29 68.6 0 25.7 9.9 49.9 28.1 68l183.1 183.2c18.1 18.1 42.2 28.1 67.9 28.1 3 0 5.9-.1 8.8-.4v.1h512c17.7 0 32-14.3 32-32s-14.3-32-32-32H479.3zm-126.8-9L169.4 671.5c-6-6-9.4-14.1-9.4-22.6 0-8.5 3.3-16.6 9.4-22.6l104.9-104.9 228.4 228.4-104.9 104.8c-6 6-14.1 9.4-22.6 9.4-8.6 0-16.6-3.3-22.7-9.4z"/></svg>'
			},
			{
				type: 'download',
				title: '下载',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M64.3 874.8v62.6c0 4.8 3.9 8.7 8.7 8.7h878c4.8 0 8.7-3.9 8.7-8.7v-62.6c0-4.8-3.9-8.7-8.7-8.7H73c-4.8 0-8.7 3.9-8.7 8.7zm418.9-99.9c3.2 2.9 6.8 5.3 10.9 7.1 5.2 2.3 10.7 3.4 16.1 3.4 9.8 0 19.5-3.6 27-10.5l291.4-270.4c3.5-3.2 3.7-8.7.5-12.2l-42.3-46.2c-3.3-3.6-8.8-3.8-12.3-.5L550.2 654.5v-528c0-4.8-3.9-8.7-8.7-8.7h-62.6c-4.8 0-8.7 3.9-8.7 8.7v527.9L239.6 442.9c-3.5-3.2-9-3-12.3.5L185 489.7c-3.2 3.5-3 9 .5 12.3l297.7 272.9z"/></svg>'
			},
			{
				type: 'fullScreen',
				title: '全屏/取消全屏',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M181.2 803.4V637H98v208c0 45.9 37.2 83.2 83.2 83.2h208V845H222.8c-23 0-41.6-18.6-41.6-41.6zM844.8 98.6h-208v83.2h166.4c23 0 41.6 18.6 41.6 41.6v166.4H928v-208c0-46-37.3-83.2-83.2-83.2zm-746.6 83v208h83.2V223.2c0-23 18.6-41.6 41.6-41.6h166.4V98.4h-208c-46 0-83.2 37.3-83.2 83.2zm746.4 455.6v166.4c0 23-18.6 41.6-41.6 41.6H636.6v83.2h208c45.9 0 83.2-37.2 83.2-83.2v-208h-83.2z"/></svg>'
			},
			{
				type: 'publish',
				title: '发布文章',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M128 554.667h768a42.667 42.667 0 0 0 0-85.334H128a42.667 42.667 0 0 0 0 85.334z"/><path d="M469.333 128v768a42.667 42.667 0 0 0 85.334 0V128a42.667 42.667 0 0 0-85.334 0z"/></svg>'
			},
			{
				type: 'about',
				title: '关于',
				innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M881.6 512.1c0 203.7-165.7 369.5-369.5 369.5S142.6 715.8 142.6 512.1s165.7-369.5 369.5-369.5 369.5 165.8 369.5 369.5m77.7 0c0-246.6-200.6-447.2-447.2-447.2S64.9 265.5 64.9 512.1s200.6 447.2 447.2 447.2 447.2-200.6 447.2-447.2M582.5 318.2c9-9 14.2-21.6 14.2-34.3 0-12.8-5.2-25.4-14.2-34.4s-21.6-14.2-34.4-14.2c-12.7 0-25.3 5.2-34.3 14.2-9.1 9-14.3 21.6-14.3 34.4 0 12.7 5.2 25.3 14.3 34.3 9 9 21.5 14.3 34.3 14.3s25.3-5.3 34.4-14.3m-96.6 464.3c-7.6 0-15.2-2.6-21.3-7.5-9.9-7.9-14.5-20.7-12.1-33.1l47.9-243.1-26.4 14.8c-16.4 9.2-37.1 3.4-46.3-13-9.2-16.4-3.4-37.1 12.9-46.3l90.7-51.1c11.6-6.5 25.9-5.7 36.6 2.1 10.8 7.8 16 21.1 13.4 34.1l-49.6 251.9 40.7-17.7c17.2-7.5 37.3.4 44.8 17.6 7.5 17.2-.4 37.3-17.6 44.8l-100.2 43.7c-4.3 1.9-8.9 2.8-13.5 2.8"/></svg>'
			}
		];
		this.plugins = [classHighlightStyle, history(), bracketMatching(), closeBrackets()];
		this.keymaps = [defaultTabBinding, ...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap];
		this.parser = new HyperDown();
		this._isPasting = false;
		this.init_ViewPort();
		this.init_Editor();
		this.init_Preview();
		this.init_Tools();
		this.init_Insert();
	}

	/* 已测 √ */
	init_ViewPort() {
		try {
			if ($('meta[name="viewport"]').length > 0) $('meta[name="viewport"]').attr('content', 'width=device-width, user-scalable=no, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover');
			else $('head').append('<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover">');
		} catch (e) {
			console.error('Init_ViewPort Error: ' + e);
		}
	}

	/* 已测 √ */
	init_Editor() {
		try {
			$('#text').before(`
				<div class="cm-container">
					<div class="cm-tools"></div>
					<div class="cm-mainer">
						<div class="cm-resize"></div>
						<div class="cm-preview">
							<div class="cm-preview-content">${this.parser.makeHtml($('#text').val())}</div>
						</div>
					</div>
					<div class="cm-progress-left"></div>
					<div class="cm-progress-right"></div>
				</div>
			`);
			const cm = new EditorView({
				state: EditorState.create({
					doc: $('#text').val(),
					extensions: [
						...this.plugins,
						keymap.of([...this.keymaps]),
						EditorView.updateListener.of(update => {
							if (!update.docChanged) return;
							$('.cm-preview-content').html(this.parser.makeHtml(update.state.doc.toString()));
						}),
						EditorView.domEventHandlers({
							paste: e => {
								const clipboardData = e.clipboardData;
								if (!clipboardData || !clipboardData.items) return;
								const items = clipboardData.items;
								if (!items.length) return;
								let blob = null;
								for (let i = 0; i < items.length; i++) {
									if (items[i].type.indexOf('image') !== -1) {
										e.preventDefault();
										blob = items[i].getAsFile();
										break;
									}
								}
								if (!blob) return;
								let api = $('script[api]').attr('api');
								if (!api) return;
								const cid = $('input[name="cid"]').val();
								cid && (api = api + '&cid=' + cid);
								if (this._isPasting) return;
								this._isPasting = true;
								const fileName = Date.now().toString(36) + '.png';
								let formData = new FormData();
								formData.append('name', fileName);
								formData.append('file', blob, fileName);
								$.ajax({
									url: api,
									method: 'post',
									data: formData,
									contentType: false,
									processData: false,
									dataType: 'json',
									xhr: () => {
										const xhr = $.ajaxSettings.xhr();
										if (!xhr.upload) return;
										xhr.upload.addEventListener(
											'progress',
											e => {
												let percent = (e.loaded / e.total) * 100;
												$('.cm-progress-left').width(percent / 2 + '%');
												$('.cm-progress-right').width(percent / 2 + '%');
											},
											false
										);
										return xhr;
									},
									success: res => {
										$('.cm-progress-left').width(0);
										$('.cm-progress-right').width(0);
										this._isPasting = false;
										const str = `${super._getLineCh(cm) ? '\n' : ''}![${res[1].title}](${res[0]})\n`;
										super._replaceSelection(cm, str);
										cm.focus();
									},
									error: () => {
										$('.cm-progress-left').width(0);
										$('.cm-progress-right').width(0);
										this._isPasting = false;
									}
								});
							}
						})
					]
				})
			});
			$('.cm-mainer').prepend(cm.dom);
			$('form[name="write_post"]').on('submit', () => $('#text').val(cm.state.doc.toString()));
			this.cm = cm;
		} catch (e) {
			console.error('Init_Editor Error: ' + e);
		}
	}

	/* 已测 √ */
	init_Preview() {
		const move = (nowClientX, nowWidth, clientX) => {
			let moveX = nowClientX - clientX;
			let moveWidth = nowWidth + moveX;
			if (moveWidth <= 0) moveWidth = 0;
			if (moveWidth >= $('.cm-mainer').outerWidth() - 16) moveWidth = $('.cm-mainer').outerWidth() - 16;
			$('.cm-preview').width(moveWidth);
		};
		$('.cm-resize').on({
			mousedown: e => {
				e.preventDefault();
				e.stopPropagation();
				const nowWidth = $('.cm-preview').outerWidth();
				const nowClientX = e.clientX;
				document.onmousemove = _e => {
					if (window.requestAnimationFrame) requestAnimationFrame(() => move(nowClientX, nowWidth, _e.clientX));
					else move(nowClientX, nowWidth, _e.clientX);
				};
				document.onmouseup = () => {
					document.onmousemove = null;
					document.onmouseup = null;
				};
				return false;
			},
			touchstart: e => {
				e.preventDefault();
				e.stopPropagation();
				const nowWidth = $('.cm-preview').outerWidth();
				const nowClientX = e.originalEvent.targetTouches[0].clientX;
				document.ontouchmove = _e => {
					if (window.requestAnimationFrame) requestAnimationFrame(() => move(nowClientX, nowWidth, _e.targetTouches[0].clientX));
					else move(nowClientX, nowWidth, _e.targetTouches[0].clientX);
				};
				document.ontouchend = () => {
					document.ontouchmove = null;
					document.ontouchend = null;
				};
				return false;
			}
		});
	}

	/* 已测 √ */
	init_Tools() {
		this.tools.forEach(item => {
			if (item.type === 'title') {
				super.handleTitle(this.cm, item);
			} else {
				const el = $(`<div class="cm-tools-item" title="${item.title}">${item.innerHTML}</div>`);
				el.on('click', e => {
					e.preventDefault();
					switch (item.type) {
						case 'fullScreen':
							super.handleFullScreen(el);
							break;
						case 'publish':
							super.handlePublish();
							break;
						case 'undo':
							super.handleUndo(this.cm);
							break;
						case 'redo':
							super.handleRedo(this.cm);
							break;
						case 'time':
							super.handleTime(this.cm);
							break;
						case 'bold':
							super._insetAmboText(this.cm, '**');
							break;
						case 'italic':
							super._insetAmboText(this.cm, '*');
							break;
						case 'delete':
							super._insetAmboText(this.cm, '~~');
							break;
						case 'code-inline':
							super._insetAmboText(this.cm, '`');
							break;
						case 'indent':
							super.handleIndent(this.cm);
							break;
						case 'hr':
							super.handleHr(this.cm);
							break;
						case 'clean':
							super.handleClean(this.cm);
							break;
						case 'ordered-list':
							super.handleOrdered(this.cm);
							break;
						case 'unordered-list':
							super.handleUnordered(this.cm);
							break;
						case 'quote':
							super.handleQuote(this.cm);
							break;
						case 'download':
							super.handleDownload(this.cm);
							break;
						case 'link':
							super.handleLink(this.cm);
							break;
						case 'image':
							super.handleImage(this.cm);
							break;
						case 'table':
							super.handleTable(this.cm);
							break;
						case 'code-block':
							super.handleCodeBlock(this.cm);
							break;
						case 'about':
							super.handleAbout();
							break;
					}
				});
				$('.cm-tools').append(el);
			}
		});
	}

	/* 已测 √ */
	init_Insert() {
		try {
			Typecho.insertFileToEditor = (file, url, isImage) => {
				const str = `${super._getLineCh(this.cm) ? '\n' : ''}${isImage ? '!' : ''}[${file}](${url})\n`;
				super._replaceSelection(this.cm, str);
				this.cm.focus();
			};
		} catch (e) {
			console.error('Init_Insert Error: ' + e);
		}
	}
}

document.addEventListener('DOMContentLoaded', () => new Joe());
