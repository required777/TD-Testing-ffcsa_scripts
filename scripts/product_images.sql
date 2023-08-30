SELECT sku, concat("https://ffcsa.deckfamilyfarm.com/static/media/",image) as image FROM shop_product where image is not null;
