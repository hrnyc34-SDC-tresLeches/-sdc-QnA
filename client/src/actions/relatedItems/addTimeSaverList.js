import searchEngine from '../../lib/searchEngine.js';
import relatedItemList from './relatedItemList.js';
import relatedItemsListDetail from './relatedItemsListDetail.js';
import relatedItemCarouselList from './relatedItemCarouselList.js';
import totalCarouselList from './totalCarouselList.js';

import { calculateProductAvgRating, calculateProductAvgStarRating } from '../RatingsReviews/setRatings.js';


const addTimeSaverList = ( notSavedItemList, wholeData, rList ) => {
  // console.log('!!! notSavedItemList came in updating saveTime !!!', notSavedItemList, wholeData, rList );
  return (dispatch) => {

    let comparingList = [];
    let updatedNeedList = [];
    let oldList = Object.keys(wholeData);
    let existingList = [];

    if ( oldList.length !== 0 ) {
      for ( let i = 0; i < oldList.length; i++ ) {
        var newId = Number.parseInt( oldList[i] );
        comparingList.push(Number.parseInt( oldList[i] ));
        existingList.push(wholeData[newId]);
      }
      for ( let i = 0; i < rList.length; i++ ) {
        var checkingId = Number.parseInt( rList[i] );
        if ( !comparingList.includes(checkingId) ) {
          updatedNeedList.push(checkingId);
        }
      }
    }

    console.log('updatedNeedList :', updatedNeedList );

    let list = [];
    let carouselList = updatedNeedList.map( itemId =>{

      return searchEngine.get(`products/${itemId}`)
        .then(res => {
          list.push( res.data );
        })
        .catch(err => console.log('adding related items list of id failed :', err));
    });

    return Promise.all(carouselList)
      .then(()=>{
        return dispatch( relatedItemsListDetail( list ) );
      })

      .then(res=>{
        let list = [];
        console.log('list:', list);
        let carouselDetailList = res.relatedItemsListDetail.map( item =>{
          let overall = item;
          return searchEngine.get(`products/${item.id}/styles`)
            .then(res => {
              var productId = item.id;
              overall.styles = res.data.results;

              searchEngine.get('reviews/meta', { product_id: productId })
                .then(({ data }) => {
                  const productAvgRating = calculateProductAvgRating(data.ratings);
                  const starRating = calculateProductAvgStarRating(productAvgRating);
                  overall.avgStarRating = starRating;
                })
                .catch(err=>console.log('adding starRating to related items list  failed :', err));

              list.push( overall );
            })
            .catch(err => console.log('adding style to related items list  failed :', err));
        });

        Promise.all(carouselDetailList)
          .then(()=>{
            dispatch( totalCarouselList(list) );
            if (updatedNeedList.length) {
              dispatch( relatedItemCarouselList([...list, ...existingList]) );
            } else {
              var result = [];
              for ( let i = 0; i < rList.length; i++ ) {
                var dataId = Number.parseInt(rList[i]);
                result.push( wholeData[dataId]);
              }
              dispatch( relatedItemCarouselList(result) );
            }
          });

      })
      .catch(err=>console.log('adding related carouselList failed :', err));

  };
};

export default addTimeSaverList;