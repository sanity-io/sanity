// legacy plugin parts - e.g. parts ids that are documented as overridable
import ArrayFunctions from 'part:@sanity/form-builder/input/array/functions'
import BooleanInput from 'part:@sanity/form-builder/input/boolean?'
import DateTimeInput from 'part:@sanity/form-builder/input/datetime?'
import EmailInput from 'part:@sanity/form-builder/input/email?'
import GeoPointInput from 'part:@sanity/form-builder/input/geopoint?'
import NumberInput from 'part:@sanity/form-builder/input/number?'
import ObjectInput from 'part:@sanity/form-builder/input/object?'
import ReferenceInput from 'part:@sanity/form-builder/input/reference?'
import StringInput from 'part:@sanity/form-builder/input/string?'
import TextInput from 'part:@sanity/form-builder/input/text?'
import UrlInput from 'part:@sanity/form-builder/input/url?'
import schema from 'part:@sanity/base/schema'
import {useRouter, IntentLink} from 'part:@sanity/base/router'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import CustomMarkers from 'part:@sanity/form-builder/input/block-editor/block-markers-custom-default'
import BlockExtras from 'part:@sanity/form-builder/input/block-editor/block-extras'
import Markers from 'part:@sanity/form-builder/input/block-editor/block-markers'
import client from 'part:@sanity/base/client'
import {WithReferringDocuments} from 'part:@sanity/base/with-referring-documents'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import {List, Item} from 'part:@sanity/components/lists/default'
import {createWeightedSearch} from 'part:@sanity/base/search/weighted'
import SanityPreview, {observePaths, observeForPreview} from 'part:@sanity/base/preview'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import {MenuButton} from 'part:@sanity/components/menu-button'
import SnackbarPart from 'part:@sanity/components/snackbar/default'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import StyleSelect from 'part:@sanity/components/selects/style'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import formBuilderConfig from 'config:@sanity/form-builder'
import userDefinedAssetSources from 'part:@sanity/form-builder/input/image/asset-sources?'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import ValidationStatusPart from 'part:@sanity/components/validation/status'
import PopoverDialogPart from 'part:@sanity/components/dialogs/popover'
import EditItemFoldPart from 'part:@sanity/components/edititem/fold'
import documentStore from 'part:@sanity/base/datastore/document'
import FieldsetPart from 'part:@sanity/components/fieldsets/default'
import ActivateOnFocusPart from 'part:@sanity/components/utilities/activate-on-focus'
import FormFieldPart from 'part:@sanity/components/formfields/default'
import ProgressCirclePart from 'part:@sanity/components/progress/circle'
import defaultAssetSources from 'all:part:@sanity/form-builder/input/image/asset-source'

export {
  ArrayFunctions,
  BooleanInput,
  DateTimeInput,
  EmailInput,
  GeoPointInput,
  NumberInput,
  ObjectInput,
  ReferenceInput,
  StringInput,
  TextInput,
  UrlInput,
  schema,
  IntentLink,
  SearchableSelect,
  CustomMarkers,
  BlockExtras,
  Markers,
  client,
  WithReferringDocuments,
  DefaultDialog,
  List,
  Item,
  createWeightedSearch,
  observeForPreview,
  ImageLoader,
  SanityPreview,
  MenuButton,
  SnackbarPart,
  DropDownButton,
  StyleSelect,
  ButtonGrid,
  formBuilderConfig,
  userDefinedAssetSources,
  FullscreenDialog,
  ValidationStatusPart,
  PopoverDialogPart,
  useRouter,
  EditItemFoldPart,
  observePaths,
  documentStore,
  FieldsetPart,
  ActivateOnFocusPart,
  FormFieldPart,
  ProgressCirclePart,
  defaultAssetSources,
}
