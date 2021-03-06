import React, { Component } from 'react';
import {
  CameraRoll,
  Platform,
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator
} from 'react-native';
import PropTypes from 'prop-types';
import GalleryManager from 'react-native-gallery-manager';

import ImageItem from './ImageItem';

class CameraRollPicker extends Component {
  state = {
    images: [],
    selected: this.props.selected,
    lastCursor: null,
    initialLoading: true,
    loadingMore: false,
    noMore: false,
    dataSource: [] // new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
  };

  componentWillMount() {
    this.fetch();
  }

  componentWillReceiveProps(nextProps) {
    const { selected } = nextProps;
    this.setState({
      selected
    });
  }

  fetch() {
    if (!this.state.loadingMore) {
      this.setState({ loadingMore: true }, () => {
        this._fetch();
      });
    }
  }

  _fetch() {
    const { groupTypes, type } = this.props;

    let fetchParams = {
      //  first: 1000,
      //    groupTypes: groupTypes,
      startFrom: 0,
      type,
      limit: 50
    };

    if (Platform.OS === 'android') {
      // not supported in android
      delete fetchParams.groupTypes;
    }

    if (this.state.lastCursor) {
      fetchParams.startFrom = this.state.lastCursor;
    }

    GalleryManager.getAssets(fetchParams).then(
      data => this._appendImages(data),
      (e) => {
        // workaround in case there's an error
        this._appendImages({ assets: [] });
        console.log({ e });
      }
    );
  }

  _appendImages(data) {
    const { assets } = data;
    let newState = {
      loadingMore: false,
      initialLoading: false
    };

    if (!data.hasMore) {
      newState.noMore = true;
    }

    if (assets.length > 0) {
      newState.lastCursor = data.next;
      newState.images = this.state.images.concat(assets);
      newState.dataSource = this._nEveryRow(
        newState.images,
        this.props.imagesPerRow
      );
    }

    this.setState(newState);
  }

  render() {
    const { dataSource } = this.state;
    const {
      scrollRenderAheadDistance,
      initialListSize,
      pageSize,
      removeClippedSubviews,
      imageMargin,
      backgroundColor,
      emptyText,
      emptyTextStyle,
      loader
    } = this.props;

    console.log("React Native Camera Roll Picker:", { state: this.state });

    if (this.state.initialLoading) {
      return (
        <View style={[styles.loader, { backgroundColor }]}>
          {loader || <ActivityIndicator />}
        </View>
      );
    }
    const listViewOrEmptyText =
      dataSource.length > 0 ? (
        <FlatList
          style={{ flex: 1 }}
          scrollRenderAheadDistance={scrollRenderAheadDistance}
          initialListSize={initialListSize}
          pageSize={pageSize}
          removeClippedSubviews={removeClippedSubviews}
          renderFooter={this._renderFooterSpinner}
          onEndReached={this._onEndReached}
          data={dataSource}
          renderItem={rowData => this._renderRow(rowData)}
          keyExtractor={item => this.getKeyForRow(item)}
        />
      ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[{ textAlign: 'center' }, emptyTextStyle]}>
              {emptyText}
            </Text>
          </View>
        );

    return (
      <View
        style={[
          styles.wrapper,
          {
            padding: imageMargin,
            paddingRight: 0,
            backgroundColor: backgroundColor
          }
        ]}
      >
        {listViewOrEmptyText}
      </View>
    );
  }

  getKeyForRow(item) {
    if (item[0]) {
      return item[0].uri;
    }

    return null;
  }

  _renderImage(item) {
    const { selected } = this.state;
    const {
      imageMargin,
      selectedMarker,
      imagesPerRow,
      containerWidth
    } = this.props;

    const { uri } = item;
    const isSelected =
      this._arrayObjectIndexOf(selected, 'uri', uri) >= 0 ? true : false;

    return (
      <ImageItem
        key={uri}
        item={item}
        selected={isSelected}
        imageMargin={imageMargin}
        selectedMarker={selectedMarker}
        imagesPerRow={imagesPerRow}
        containerWidth={containerWidth}
        onClick={this._selectImage}
        isVideo={item.type === 'video'}
      />
    );
  }

  _renderRow(rowData) {
    const items = rowData.item.map(item => {
      if (item === null) {
        return null;
      }
      return this._renderImage(item);
    });

    return <View style={styles.row}>{items}</View>;
  }

  _renderFooterSpinner = () => {
    if (!this.state.noMore) {
      return <ActivityIndicator style={styles.spinner} />;
    }
    return null;
  }

  _onEndReached = () => {
    if (!this.state.noMore) {
      this.fetch();
    }
  }

  _selectImage = (image) => {
    const { maximum, imagesPerRow, callback, selectSingleItem } = this.props;

    const selected = this.state.selected,
      index = this._arrayObjectIndexOf(selected, 'uri', image.uri);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      if (selectSingleItem) {
        selected.splice(0, selected.length);
      }
      if (selected.length < maximum) {
        selected.push(image);
      }
    }

    this.setState({
      selected,
      dataSource: this._nEveryRow(this.state.images, imagesPerRow)
    });

    callback(selected, image);
  }

  _nEveryRow(data, n) {
    const result = [];
    let temp = [];

    for (var i = 0; i < data.length; ++i) {
      if (i > 0 && i % n === 0) {
        result.push(temp);
        temp = [];
      }
      temp.push(data[i]);
    }

    if (temp.length > 0) {
      while (temp.length !== n) {
        temp.push(null);
      }
      result.push(temp);
    }

    return result;
  }

  _arrayObjectIndexOf(array, property, value) {
    return array
      .map(o => {
        return o[property];
      })
      .indexOf(value);
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1
  },
  loader: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    flex: 1
  },
  marker: {
    position: 'absolute',
    top: 5,
    backgroundColor: 'transparent'
  }
});

CameraRollPicker.propTypes = {
  scrollRenderAheadDistance: PropTypes.number,
  initialListSize: PropTypes.number,
  pageSize: PropTypes.number,
  removeClippedSubviews: PropTypes.bool,
  groupTypes: PropTypes.oneOf([
    'Album',
    'All',
    'Event',
    'Faces',
    'Library',
    'PhotoStream',
    'SavedPhotos'
  ]),
  maximum: PropTypes.number,
  type: PropTypes.oneOf(['photos', 'videos', 'all']),
  selectSingleItem: PropTypes.bool,
  imagesPerRow: PropTypes.number,
  imageMargin: PropTypes.number,
  containerWidth: PropTypes.number,
  callback: PropTypes.func,
  selected: PropTypes.array,
  selectedMarker: PropTypes.element,
  backgroundColor: PropTypes.string,
  emptyText: PropTypes.string,
  emptyTextStyle: Text.propTypes.style,
  loader: PropTypes.node
};

CameraRollPicker.defaultProps = {
  scrollRenderAheadDistance: 500,
  initialListSize: 1,
  pageSize: 3,
  removeClippedSubviews: true,
  groupTypes: 'SavedPhotos',
  maximum: 15,
  imagesPerRow: 3,
  imageMargin: 5,
  selectSingleItem: false,
  type: 'all',
  backgroundColor: 'white',
  selected: [],
  callback: function (selectedImages, currentImage) {
    console.log(currentImage);
    console.log(selectedImages);
  },
  emptyText: 'No photos.'
};

export default CameraRollPicker;
