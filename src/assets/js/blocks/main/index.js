/* eslint-disable no-param-reassign */
import BlockEdit from './edit';
import BlockSave from './save';

let options = window.lazyblocksGutenberg;
if (!options || !options.blocks || !options.blocks.length) {
  options = {
    post_type: 'post',
    blocks: [],
    controls: {},
  };
}

const { registerBlockType } = wp.blocks;

// each registered block.
options.blocks.forEach((item) => {
  // conditionally show for specific post type.
  if (item.supports.inserter && item.condition.length) {
    let preventInsertion = true;
    item.condition.forEach((val) => {
      if (val === options.post_type) {
        preventInsertion = false;
      }
    });
    item.supports.inserter = !preventInsertion;
  }

  let registerIcon = '';

  if (item.icon && /^dashicons/.test(item.icon)) {
    registerIcon = item.icon.replace(/^dashicons dashicons-/, '') || 'marker';
  } else if (item.icon) {
    // eslint-disable-next-line react/no-danger
    registerIcon = <span dangerouslySetInnerHTML={{ __html: item.icon }} />;
  }

  // register block.
  registerBlockType(item.slug, {
    title: item.title || item.slug,
    description: item.description,
    icon: registerIcon,
    category: item.category,
    keywords: item.keywords,
    supports: item.supports,

    ghostkit: item.ghostkit,

    lazyblock: true,

    edit(props) {
      return <BlockEdit {...props} lazyBlockData={item} />;
    },

    save(props) {
      return <BlockSave {...props} lazyBlockData={item} />;
    },
  });
});
