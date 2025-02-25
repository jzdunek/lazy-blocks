/**
 * External dependencies.
 */
import deepEqual from 'deep-equal';

/**
 * WordPress dependencies.
 */
const { Spinner } = wp.components;

const { useEffect, useState, useRef, RawHTML, Fragment } = wp.element;

const { __, sprintf } = wp.i18n;

const { apiFetch } = wp;

const { doAction } = wp.hooks;

const { useSelect } = wp.data;

const { useDebounce, usePrevious } = wp.compose;

/**
 * Block Editor custom PHP preview.
 *
 * Based on ServerSideRender
 * https://github.com/WordPress/gutenberg/blob/master/packages/components/src/server-side-render/index.js
 */
export default function PreviewServerCallback(props) {
  const {
    block,
    attributes = null,
    urlQueryArgs = {},
    onBeforeChange = () => {},
    onChange = () => {},
  } = props;

  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allowRender, setAllowRender] = useState(true);

  const isMountedRef = useRef(true);
  const currentFetchRequest = useRef(null);

  const prevProps = usePrevious(props);

  const { postId } = useSelect((select) => {
    const { getCurrentPostId } = select('core/editor') || {};

    return {
      postId: getCurrentPostId ? getCurrentPostId() : 0,
    };
  }, []);

  function fetchData() {
    if (!isMountedRef.current) {
      return;
    }

    setIsLoading(true);

    // Store the latest fetch request so that when we process it, we can
    // check if it is the current request, to avoid race conditions on slow networks.
    const fetchRequest = apiFetch({
      path: 'lazy-blocks/v1/block-render',
      method: 'POST',
      data: {
        context: 'editor',
        name: block,
        post_id: postId || 0,
        ...(attributes !== null ? { attributes } : {}),
        ...urlQueryArgs,
      },
    })
      .then((res) => {
        if (!isMountedRef.current) {
          return;
        }

        if (fetchRequest === currentFetchRequest.current) {
          onBeforeChange();
          doAction('lzb.components.PreviewServerCallback.onBeforeChange', props);
          doAction('lazyblocks.components.PreviewServerCallback.onBeforeChange', props);

          if (res && res.success) {
            setResponse(res.response);
          } else if (res && !res.success && res.error_code) {
            if (res.error_code === 'lazy_block_invalid') {
              setResponse(null);
            } else if (res.error_code === 'lazy_block_no_render_callback') {
              setResponse(null);
              setAllowRender(false);
            }
          }
        }

        setIsLoading(false);
      })
      .catch((res) => {
        if (!isMountedRef.current) {
          return;
        }

        if (fetchRequest === currentFetchRequest.current) {
          onBeforeChange();
          doAction('lzb.components.PreviewServerCallback.onBeforeChange', props);
          doAction('lazyblocks.components.PreviewServerCallback.onBeforeChange', props);

          setResponse({
            error: true,
            response: res,
          });
        }

        setIsLoading(false);
      });

    currentFetchRequest.current = fetchRequest;
  }

  const debouncedFetchData = useDebounce(fetchData, 500);

  // When the component unmounts, set isMountedRef to false. This will
  // let the async fetch callbacks know when to stop.
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    if (!allowRender) {
      return;
    }

    // Don't debounce the first fetch. This ensures that the first render
    // shows data as soon as possible
    if (prevProps === undefined) {
      fetchData();
    } else if (!deepEqual(prevProps.attributes, props.attributes)) {
      debouncedFetchData();
    }
  });

  // Handle callbacks and events when response changed.
  useEffect(() => {
    onChange();
    doAction('lzb.components.PreviewServerCallback.onChange', props);
    doAction('lazyblocks.components.PreviewServerCallback.onChange', props);
  }, [response]);

  let result = '';

  if (!allowRender) {
    result = '';
  } else if (response && response.error) {
    // translators: %s: error message describing the problem
    const errorMessage = sprintf(
      __('Error loading block preview: %s', '@@text_domain'),
      response.response
    );
    result = errorMessage;
  } else {
    result = (
      <Fragment>
        {response ? <RawHTML>{response}</RawHTML> : ''}
        {isLoading ? <Spinner /> : ''}
      </Fragment>
    );
  }

  return <div className="lzb-preview-server">{result}</div>;
}
