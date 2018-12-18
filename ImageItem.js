import React, { Component } from 'react';
import { Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';

class ImageItem extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    var { width } = Dimensions.get('window');
    var { imageMargin, imagesPerRow, containerWidth } = this.props;

    if (typeof containerWidth != 'undefined') {
      width = containerWidth;
    }
    this._imageSize = (width - (imagesPerRow + 1) * imageMargin) / imagesPerRow;
  }

  render() {
    var { item, selected, selectedMarker, imageMargin, isVideo } = this.props;

    var marker = selectedMarker ? (
      selectedMarker
    ) : (
      <Image
        style={[styles.marker, { width: 25, height: 25 }]}
        source={require('./circle-check.png')}
      />
    );

    const videoIndicator = isVideo ? <Icon name={'videocam'} size={20} style={styles.video} /> : null;

    var image = item;

    return (
      <TouchableOpacity
        style={{ marginBottom: imageMargin, marginRight: imageMargin }}
        onPress={() => this._handleClick(image)}
      >
        <Image
          source={{ uri: image.uri }}
          style={{ height: this._imageSize, width: this._imageSize }}
        />
        {selected ? marker : null}
        {videoIndicator}
      </TouchableOpacity>
    );
  }

  _handleClick(item) {
    this.props.onClick(item);
  }
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'transparent'
  },
  video: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'transparent',
    color: 'white'
  }
});

ImageItem.defaultProps = {
  item: {},
  selected: false
};

ImageItem.propTypes = {
  item: PropTypes.object,
  selected: PropTypes.bool,
  selectedMarker: PropTypes.element,
  imageMargin: PropTypes.number,
  imagesPerRow: PropTypes.number,
  onClick: PropTypes.func
};

export default ImageItem;
