<?php
/* 加强评论拦截功能 */
Typecho_Plugin::factory('Widget_Feedback')->comment = array('Intercept', 'message');
class Intercept
{
    public static function message($comment)
    {
        /* 如果用户输入内容画图模式 */
        if (preg_match('/\{!\{(.*)\}!\}/', $comment['text'], $matches)) {
            /* 如果判断是否有双引号，如果有双引号，则禁止评论 */
            if (strpos($matches[1], '"') !== false || _checkXSS($matches[1])) {
                $comment['status'] = 'waiting';
            }
        } else {
            /* 判断评论内容是否包含敏感词 */
            if (Helper::options()->JSensitiveWords) {
                if (_checkSensitiveWords(Helper::options()->JSensitiveWords, $comment['text'])) {
                    $comment['status'] = 'waiting';
                }
            }
            /* 判断评论是否至少包含一个中文 */
            if (Helper::options()->JLimitOneChinese === "on") {
                if (preg_match("/[\x{4e00}-\x{9fa5}]/u", $comment['text']) == 0) {
                    $comment['status'] = 'waiting';
                }
            }
        }
        Typecho_Cookie::delete('__typecho_remember_text');
        return $comment;
    }
}

/* 加强后台编辑器功能 */
if (Helper::options()->JEditor !== 'off') {
    Typecho_Plugin::factory('admin/write-post.php')->richEditor  = array('Editor', 'Edit');
    Typecho_Plugin::factory('admin/write-page.php')->richEditor  = array('Editor', 'Edit');
}

class Editor
{
    public static function Edit()
    {
?>
        <link rel="stylesheet" href="<?php Helper::options()->themeUrl('typecho/write/css/joe.write.min.css') ?>">
		<script src="https://cdn.jsdelivr.net/npm/hyperdown@2.4.10/Parser.min.js"></script>
        <script api="<?php Helper::security()->index('/action/upload'); ?>" src="<?php Helper::options()->themeUrl('typecho/write/js/joe.write.chunk.js') ?>"></script>
<?php
    }
}
