const { __ } = wp.i18n;

const { PanelBody, TextControl, TextareaControl } = wp.components;

export default function DefaultRow(props) {
  const { updateData, data } = props;

  let ControlType = TextControl;

  switch (data.type) {
    case 'classic_editor':
    case 'code_editor':
    case 'rich_text':
    case 'textarea':
      ControlType = TextareaControl;
      break;
    // no default
  }

  return (
    <PanelBody>
      <ControlType
        label={__('Default value', '@@text_domain')}
        help={__('Appears when inserting a new block', '@@text_domain')}
        value={data.default}
        onChange={(value) => updateData({ default: value })}
      />
    </PanelBody>
  );
}
