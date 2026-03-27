package com.transactionapp.transactionsorter.BucketService;

public class BucketUpdateRequest {
    private String tag;
    private boolean removeTag;
    private String  name;


    public BucketUpdateRequest() {
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public void markRemoveTag() { removeTag = true; }

    public boolean isRemoveTag() { return removeTag; }

    public void setName(String name) {
        this.name = name;
    }

    public String getTag() {
        return tag;
    }

    public String getName() {
        return name;
    }
}