export const YARN_HUES = ['紅色系', '橘色系', '黃色系', '粉色系', '綠色系', '藍色系', '紫色系', '棕褐色系', '白色/米色', '灰色系', '黑色', '螢光色', '金屬色'];
export const YARN_DYE_STYLES = ['單色 (Solid)', '擬單色 (Semi-solid)', '段染 (Variegated)', '自動條紋 (Self-striping)', '潑墨/點狀 (Speckled)', '夾雜/花呢 (Tweed)', '漸層 (Gradient)'];
export const YARN_WEIGHTS = ['0 Lace', '1 Super Fine', '2 Fine', '3 Light', '4 Medium', '5 Bulky', '6 Super Bulky', '7 Jumbo'];
export const TOOL_MATERIALS = ['竹', '木', '鋼', '鋁', '塑膠'];
export const TOOL_JOINT_SIZES = ['S (小)', 'M (中)', 'L (大)', '其他'];

export const TOOL_SCHEMA = {
  '針具類': { '棒針': ['固定式輪針', '可拆式輪針', '單頭/雙頭棒針'], '鉤針': ['單頭鉤針', '雙頭鉤針', '阿富汗鉤針'], '特殊針': ['麻花針', '防解針'], '輪針連接線': ['輪針連接線'] },
  '配件類': { '計量與標記': ['記號鉤/圈', '測量工具', '計數器'], '縫合與修飾': ['毛線針', '剪切工具', '其他輔助'], '定型與整燙': ['定型板', '定型針', '定型線/鋼絲', '毛球修剪器'] }
};

export const KNIT_TERMS = { 'K': '下針 (Knit)', 'P': '上針 (Purl)', 'K2tog': '左上兩針併一針', 'ssk': '右上兩針併一針', 'yo': '掛針 (Yarn Over)', 'C4F': '前交叉4針麻花', 'C4B': '後交叉4針麻花', 'CO': '起針 (Cast On)', 'BO': '收編 (Bind Off)', 'sl1': '滑針 (Slip 1)' };
export const CROCHET_TERMS = { 'ch': '鎖針 (Chain)', 'sc': '短針 (Single Crochet)', 'hdc': '中長針 (Half Double Crochet)', 'dc': '長針 (Double Crochet)', 'sl st': '引拔針 (Slip Stitch)', 'Magic Ring': '環起針', 'MR': '環起針', 'inc': '加針 (Increase)', 'dec': '減針 (Decrease)' };
